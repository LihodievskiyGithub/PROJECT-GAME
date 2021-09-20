document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-go');
    const infoDisplay = document.querySelector('#info');
    const singlePlayerButton = document.querySelector('#singlePlayerButton')
    const multiPlayerButton = document.querySelector('#multiPlayerButton')

    //создаем отдельный массив для пользовательской сетки, чтобы отслеживать помещение квадрата, при его создании 
    const userSquares = []; 
    //создаем отдельный массив для компьютерной сетки, чтобы отслеживать помещение квадрата, при его создании 
    const computerSquares = []; 

    let isGameOver = false
    let currentPlayer = 'user'

    let horizontal = true;
    // let allShipsPlaced = false

    const widthSquares = 10;

    //игровой режим изначально равен 0
    let gameMode = "";
    // Мы будем считать, что мы нулевой игрок
    let playerNum = 0;
    //Отслеживаем, готов ли игрок
    let ready = false;
    //Готов ли враг
    let enemyReady = false;
    //Мы не хотим, чтобы люди размещали корабли до начала игры, поэтому отслеживаем размещенные корабли
    let allShipsPlaced = false;
    // Количество произведенных выстрелов 
    let shotFired = -1;

    // Выберите режим плеера
    singlePlayerButton.addEventListener('click', startSinglePlayer)
    multiPlayerButton.addEventListener('click', startMultiPlayer)


        // Multiplayer
    function startMultiPlayer() {
        gameMode ="multiPlayer";

        const socket = io(); // io будет выходить из скрипта, который мы добавили ранее
            // Получаем номер игрока
        socket.on('player-number', num => {
        if (num === -1){
            infoDisplay.innerHTML = "Извините, сервер полон"
        } else {
            playerNum = parseInt(num); // данные, передаваемые с socket.io - строка
            if(playerNum === 1) currentPlayer = "enemy"; // если номер игрока = 1, то игрок равен врагу
            console.log(playerNum);

            //Статус готовности игроков при входе в игру
            socket.emit('check-players'); // прочим сервер проверить, есть ли другие игроки
        }
    }) 

        //Другой игрок подключился или отключился
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`);
            playerConnectedOrDisconnected(num);
        })

        socket.on('enemy-ready', num => {
            enemyReady = true
            playerReady(num)
            if (ready) playGameMulti(socket)// если готовы, то запускаем мультиплеер и передаем сокет
        })

        //Проверка статуса игрока(готов или нет)
        socket.on('check-players', players => {
            players.forEach((p, i) => {
              if(p.connected) playerConnectedOrDisconnected(i)
              if(p.ready) {
                playerReady(i)
                if(i !== playerNum) enemyReady = true
              }
            })
          })

        //Тайм-аут
        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'Вы потратили лимит в 10 минут'
        })

        // кнопка готовности
        startButton.addEventListener('click', () => {
            if(allShipsPlaced) playGameMulti(socket)
            else infoDisplay.innerHTML = "Пожалуйста, разместите все корабли"
        })

        //Настраиваем прослушиватель событий для стрельбы
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
            if(currentPlayer === 'user' && ready && enemyReady) {
                shotFired = square.dataset.id
                socket.emit('fire', shotFired)// отправляем наш огонь на сервер
                }
            })
        })

        // Получение огня на стороне клиента
        socket.on('fire', id => { // сервер отправляет его обратно другому клиенту
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)// получаем класс taken(взят) и тип корабля и отправляем обратно на сервер
            playGameMulti(socket)// запускаем чтобы убедиться, что все в порядке
        })

        // Получаем ответ от выстрела
        socket.on('fire-reply', classList => {
            revealSquare(classList)// получаем список классов
            playGameMulti(socket)// передаем в сокет, который будет переключать на след игрока
        })


        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}` //получаем доступ к классу p1 и p2
            // добавляем +1, потому что изначально индекс 0
            document.querySelector(`${player} .connected span`).classList.toggle('green')
            //если подключающийся игрок МЫ
            if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }
    }


    //SinglePlayer
    function startSinglePlayer() {
        gameMode = "singlePlayer"

        generate(shipArray[0])
        generate(shipArray[1])
        generate(shipArray[2])
        generate(shipArray[3])
        generate(shipArray[4])

                //При нажатии этой кнопки вызывалась функия playGame и игра начинанась
        startButton.addEventListener('click', playGameSingle);
    }


    // Создаем доску; Генерируем 100 квадратов, то есть, будем повторять через цикл это 100 раз
    // Для этого и объявляем переменную "width = 10"
    function createBoard(grid, squares, widthSquares) {
        for (let i = 0; i < widthSquares * widthSquares; i++) {
            const square = document.createElement('div')
            // Дадим каждому квадрату id = i (порядок от 0 до 99) через dataset, потому что data-* атрибуты позволяют хранить дополнительную информацию в стандартных элементах HTML
            square.dataset.id = i;
            //Помещаем в сетку div и делаем это 100 раз
            grid.appendChild(square);
            squares.push(square);
        }
    }

    // Делаем компьютерную сетку такой же, передавая в нее параметры
    createBoard(userGrid, userSquares, widthSquares);
    createBoard(computerGrid, computerSquares, widthSquares);
    

    //Массивы для всех кораблей

    const shipArray = [
        {
            name: 'destroyer',
            directions: [
            [0, 1],
            [0, widthSquares]
        ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, widthSquares, widthSquares*2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, widthSquares, widthSquares*2]
            ] 
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, widthSquares, widthSquares*2, widthSquares*3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, widthSquares, widthSquares*2, widthSquares*3, widthSquares*4]
            ]
        },
    ]


        //Корабли в случайных позициях
        function generate(ship){ 
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
// Math.abs - возвращает асболютное значение. Например: -1 = 1, null = 0, '' = 0;
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

        // contains ( String )Проверяет, есть ли данный класс у элемента (вернёт true или false)
            const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
            // проверяет, находимся мы на правом краю или нет. Ширина 10 дает остаток...
            const isAtRightEdge = current.some(index => (randomStart + index) % widthSquares === widthSquares - 1)
            // Тоже самое, только для левого края
            const isAtLeftEdge = current.some(index => (randomStart + index) % widthSquares === 0)
            
            if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))

            else generate(ship)

        }



        // Вращение кораблей по кнопке rotateButton
        function rotate(){
            //toggle ( String [, Boolean]) Если класс у элемента отсутствует - добавляет, иначе - убирает. Когда вторым параметром передано false - удаляет указанный класс, а если true - добавляет.
            if(horizontal){
                destroyer.classList.toggle('destroyer-container-vertical')
                submarine.classList.toggle('submarine-container-vertical')
                cruiser.classList.toggle('cruiser-container-vertical')
                battleship.classList.toggle('battleship-container-vertical')
                carrier.classList.toggle('carrier-container-vertical')
                horizontal = false;
                console.log(horizontal);
                return
            }
            if(!horizontal){
                destroyer.classList.toggle('destroyer-container')
                submarine.classList.toggle('submarine-container')
                cruiser.classList.toggle('cruiser-container')
                battleship.classList.toggle('battleship-container')
                carrier.classList.toggle('carrier-container')
                horizontal = true;
                console.log(horizontal);
                return
            }
        }
        rotateButton.addEventListener('click', rotate)


        // Drag and Drop кораблей

        ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
        userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
        userSquares.forEach(square => square.addEventListener('dragover', dragOver))
        userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
        userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
        userSquares.forEach(square => square.addEventListener('drop', dragDrop))
        userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

        let selectedShipNameWithIndex;
        let draggedShip;
        let draggedShipLength;

        ships.forEach(ship => ship.addEventListener('mousedown', (ev) => {
        selectedShipNameWithIndex = ev.target.id
    // console.log(selectedShipNameWithIndex)
}))

    function dragStart() {
        draggedShip = this
        draggedShipLength = this.childNodes.length
    console.log(draggedShip)
    }

    function dragOver(ev) {
        ev.preventDefault()
    }

    function dragEnter(ev) {
        ev.preventDefault()
    }

    function dragLeave() {
    console.log('drag leave')
    }

    function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0, -2);
    // console.log(shipClass)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
    // console.log(shipLastId)
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    console.log(shipLastId)

    if (horizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
    for (let i=0; i < draggedShipLength; i++) {
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass)
    }
    //Пока индекс корабля, который вы перетаскиваете, не находится в массиве newNotAllowedVertical! Это означает, что иногда, если вы тащите корабль за
    //index-1, index-2 и так далее, корабль отскочит обратно к displayGrid.
    } else if (!horizontal && !newNotAllowedVertical.includes(shipLastId)) {
    for (let i=0; i < draggedShipLength; i++) {
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + widthSquares*i].classList.add('taken', shipClass)
    }
    } else return

    displayGrid.removeChild(draggedShip)
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
}


        function dragEnd(){
            console.log('end');
        }



//Логика игры для однопользовательского режима
function playGameMulti(socket) {
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Go'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Go"
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready span`).classList.toggle('green')
  }

        function playGameSingle(){
            if (isGameOver) return
            if(currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Твой ход!';
                computerSquares.forEach(square => square.addEventListener('click', function(ev) {
                    shotFired = square.dataset.id
                    revealSquare(square.classList)
                }))
            }
            if (currentPlayer === 'enemy') {
                turnDisplay.innerHTML = 'Ход компьютера!';
                //Будет в дальнейшем функциональность компьютера
                setTimeout(enemyGo, 1000);
            }
        }




        let destroyerCount=0;
        let submarineCount=0;
        let cruiserCount=0;
        let battleshipCount=0;
        let carrierCount=0;

        //Квадрат, на который мы нажимаем. Эта функция вызывается в PlayGame - когда ходит user
        function revealSquare(classList){
            // получаем div с идентификатором данных из компьютерной сетки, который передаем в выстрел, так что мы можем сказать, получили мы промах или попадание
            const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
            const obj = Object.values(classList) //превращаем список классов в объект, чтобы было легче искать его
            
            // проверка:чтобы при нажатии на квадрат повторно - не было повторного хода
            if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){

                if(obj.includes('destroyer')) destroyerCount++;
                includes
            
                if(obj.includes('submarine')) submarineCount++;
                
            
                if(obj.includes('cruiser')) cruiserCount++;
                
            
                if(obj.includes('battleship')) battleshipCount++;
                
            
                if(obj.includes('carrier')) carrierCount++; 
                
            }
                // Если square содкржит класс taken, то мы присваем класс boom(стрельба)
            if(obj.includes('taken')){
                enemySquare.classList.add('boom');
                console.log('click');
            } else {
                enemySquare.classList.add('miss')
            }
            //проверяем наличие побед
            checkForWins();
            currentPlayer = 'enemy';
            if(gameMode === 'singlePlayer') playGameSingle();
        }



        let cpuDestroyerCount=0;
        let cpuSubmarineCount=0;
        let cpuCruiserCount=0;
        let cpuBattleshipCount=0;
        let cpuCarrierCount=0;

        // Логика компьютера
        function enemyGo(square) {
            //если одиночная игра, то мы будем передавать квадрат (undefined)
            //поэтому мы его определяем как бы давая случайное число
            if(gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length);
            if (!userSquares[square].classList.contains('boom')){
                userSquares[square].classList.add('boom');
                if(userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;         
                if(userSquares[square].classList.contains('submarine'))  cpuSubmarineCount++;   
                if(userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
                if(userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
                if(userSquares[square].classList.contains('carrier')) cpuCarrierCount++;
                checkForWins();
        } else if(gameMode === 'singlePlayer') enemyGo();  // если он попадает в тот же квадрат мы хотим, мы вызываем функцию снова, чтобы сгенерировать другое случ число
        
        currentPlayer = 'user';
        turnDisplay.innerHTML='Твой ход!'
    }


    function checkForWins() {
        let enemy = 'computer'
        if(gameMode === 'multiPlayer') enemy = 'enemy'
        if (destroyerCount === 2) {
            infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`
            destroyerCount = 10
          }
          if (submarineCount === 3) {
            infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`
            submarineCount = 10
          }
          if (cruiserCount === 3) {
            infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`
            cruiserCount = 10
          }
          if (battleshipCount === 4) {
            infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`
            battleshipCount = 10
          }
          if (carrierCount === 5) {
            infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`
            carrierCount = 10
          }
          if (cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = `${enemy} sunk your destroyer`
            cpuDestroyerCount = 10
          }
          if (cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = `${enemy} sunk your submarine`
            cpuSubmarineCount = 10
          }
          if (cpuCruiserCount === 3) {
            infoDisplay.innerHTML = `${enemy} sunk your cruiser`
            cpuCruiserCount = 10
          }
          if (cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = `${enemy} sunk your battleship`
            cpuBattleshipCount = 10
          }
          if (cpuCarrierCount === 5) {
            infoDisplay.innerHTML = `${enemy} sunk your carrier`
            cpuCarrierCount = 10
          }

    if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
      infoDisplay.innerHTML = "YOU WIN"
      gameOver()
    }
    if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
      infoDisplay.innerHTML =  `${enemy.toUpperCase()} WINS`
      gameOver()
    }
  }

    function gameOver() {
    isGameOver = true;
    startButton.removeEventListener('click', playGameSingle);
}

    })