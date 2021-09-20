const User = require("./model/user");
const Score = require("./model/score");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Вытащим пару вещей, которые понадобятся в дальнейшем
// Путь
const express = require('express')

const path = require('path')
// Нужен http, чтобы создать сервер
const http = require('http')
// Порт
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const { connect } = require('http2')
//Приложение
const app = express()
// Передаем приложение
const server = http.createServer(app)
// Передадим socket серверу
const io = socketio(server)

const result = require("dotenv").config();
if(result.error) {
    console.log(result.error);
}
require("./config/database.js").connect();
console.log(process.env.MONGO_URI);

//Установаим статичную папку, которая будт служить нашему клиенту и мы передадим ее клиенту
app.use(express.static(path.join(__dirname, "..", "public_folder")))
app.use(express.json());



// Запускаем сервер
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

//Обрабатывать запрос на подключение к сокету от веб-клиента (io - это наш сервер сокета io; сокет - практический клиент, который подключается)

const connections = [null, null]

io.on('connection', function(socket) {
    console.log('A user connected');
    let playerIndex = -1;

    //Найдем доступный номер игрока
    for(const i in connections){
        if(connections[i] === null){
            playerIndex = i;
            break
        }
    }

    socket.on('user-connect', (nickname) => {
        socket.playerIndex = playerIndex;
        socket.nickname = nickname;
        
    // socket.emit позволяет создавать пользовательские события на сервере и клиенте
        //Скажем подключающемуся игроку, какой у него номер игрока
        socket.emit('player-number', {playerIndex, nickname});
        console.log(`Player ${playerIndex} has connected`);

        // Будут играть всего 2 игрока, поэтому нужно проигнорировать третьего
        if(playerIndex === -1) return

        connections[playerIndex] = false;
        

        //Оповестить всех, какой номер игрока законектился
        socket.broadcast.emit('player-connection', playerIndex);
    });

    //Вернемся в app.js  и юудем использовать socket.io для прослушивания того, что номер игрока передается нам

    //Disconnect
    socket.on('disconnect', () => {
       console.log(`Player ${playerIndex} disconnected`);
       connections[playerIndex] = null;

       // Объявить, что игрок отсоединился
       socket.broadcast.emit('player-connection', playerIndex)
    });

        //Готовность
        socket.on('player-ready', () => {
            socket.broadcast.emit('enemy-ready', playerIndex)
            connections[playerIndex] = true;
        })

        // Проверка подключения игроков
        socket.on('check-players', () => {
            const players = []
            for (const i in connections) {
                // если соединение равно 0, то мы собираемся добавить в массив (игроки) объект
                connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
            }
            socket.emit('check-players', players)
        });

        // socket.on('get-player-names', () => {
        //     const players = [...io.of('/').sockets].slice(0, 2);
        //     const playerNames = players.map(({playerIndex, nickname}) => ({playerIndex, nickname}));
        //     console.log(Object.keys(io.of('/').sockets), playerNames);
        //     socket.broadcast.emit('send-player-names', playerNames);
        // });


        //Выстрел
        socket.on('fire', id => {
            console.log(`Shot fired from ${playerIndex}`, id)

            // передаем ход другому игроку
            socket.broadcast.emit('fire', id)
        })

        // Получаем ответ, дошел ли выстрел до игрока или нет
        socket.on('fire-reply', square => {
            console.log(square)
        

            // Переслаем ответ другому игроку
            socket.broadcast.emit('fire-reply', square)
        })

        //Тайм-аут соединения
        setTimeout(() => {
            connections[playerIndex] = null
            socket.emit('timeout')
            socket.disconnect() // через 10 минут мы отключим игрока и отправим ему соотв. сообщение
        }, 600000) // 10 минут для каждого игрока, чтобы многие могли поиграть

});

app.post("/register", async (req, res) => {

// Our register logic starts here
try {
    // Get user input
    const { nickname, password } = req.body;

    // Validate user input
    if (!(password && nickname)) {
    res.status(400).send("All input is required");
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ nickname });

    if (oldUser) {
    return res.status(400).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
        nickname,
        password: encryptedPassword,
    });

    const singlePlayerScore = await Score.create({
        score: 0,
        nickname,
        mode: 'singleplayer'
    });

    const multiPlayerScore = await Score.create({
        score: 0,
        nickname,
        mode: 'multiplayer'
    });

    // Create token
    const token = jwt.sign(
    { user_id: user._id, nickname },
    process.env.TOKEN_KEY,
    {
        expiresIn: "2h",
    }
    );

    // return new user
    res.status(201).json({
        nickname: user.nickname,
        _id: user._id,
        token
    });
} catch (err) {
    console.log(err);
}
// Our register logic ends here
});

// ...

// Login
app.post("/login", async (req, res) => {

// Our login logic starts here
try {
    // Get user input
    const { nickname, password } = req.body;

    // Validate user input
    if (!(nickname && password)) {
    res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ nickname });

    if (user && (await bcrypt.compare(password, user.password))) {
    // Create token
    const token = jwt.sign(
        { user_id: user._id, nickname },
        process.env.TOKEN_KEY,
        {
        expiresIn: "2h",
        }
    );
    
    // user
    res.status(201).json({
        nickname: user.nickname,
        _id: user._id,
        token
    });
    }
    res.status(400).send("Wrong password");
} catch (err) {
    console.log(err);
}
// Our register logic ends here
});

app.put("/score", async (req, res) => {
    const { token, mode } = req.body;
    const userInfo = await jwt.verify(token, process.env.TOKEN_KEY);
    const userScore = await Score.findOne({nickname: userInfo.nickname, mode});
    if (!userScore) {
        res.status(400).send("UserScore is not found");
    }
    userScore.score += 1;
    await userScore.save();

    res.status(200).send({score:userScore.score});
});

app.get("/score", async (req, res) => {
    const scores = await Score.find();
    res.status(200).send({scores});
});
