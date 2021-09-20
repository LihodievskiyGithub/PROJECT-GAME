import { login, isUserLoggedIn, logOut } from "./auth.js";

const signButton = document.querySelector('.sign-button');
const nickInput = document.querySelector('#reg_nickname');
const passInput = document.querySelector('#reg_password');
const modalWrapper = document.querySelector('.reg-mod-wrapper');
const singlePlayerButton = document.querySelector('.singleplayer-btn');
const multiPlayerButton = document.querySelector('.multiplayer-btn');
const loginButton = document.querySelector('.login-button');
const skipLogin = document.querySelector('.skip-button');
const changheText = document.querySelector('.change_text');
const logOutButton = document.querySelector('.logout');

let mode = 'singleplayer';

if(isUserLoggedIn()){
    logOutButton.style.display="block"; 
}

logOutButton.addEventListener('click', () => {
    logOut();
    logOutButton.style.display="none";
})


function navToGame() {
    window.location.assign(`https://battleshippro.herokuapp.com/${mode}.html`);
}

skipLogin.addEventListener('click', () => {
    navToGame();
})

singlePlayerButton.addEventListener('click', (ev) => {
    changheText.innerHTML = 'Login if you want  to see your result on the leaderboard';
    skipLogin.style.display='block';
    mode = 'singleplayer';
    ev.preventDefault();
    if(!isUserLoggedIn()){
        modalWrapper.style.display = 'block';
    } else {
        navToGame();
    }
}) 

multiPlayerButton.addEventListener('click', (ev) => {
    changheText.innerHTML = 'Login, please to start the game!';
    skipLogin.style.display='none';
    mode = 'multiplayer';
    ev.preventDefault();
    if(!isUserLoggedIn()){
        modalWrapper.style.display = 'block';
    } else {
        navToGame();
    }
})

loginButton.addEventListener('click', () => {
    const data = {
        nickname: nickInput.value,
        password: passInput.value,
    }
    
        fetch('https://battleshippro.herokuapp.com/login', {
            method: 'POST',
            mode: 'same-origin',
            headers: {
            'Content-Type':'application/json'
            },
            body:JSON.stringify(data)
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw response.text();
        }).then((user) => {
            login(user);
            modalWrapper.style.display='none';
            navToGame();
        }).catch((error) => {
            error.then((errorText) => {
                alert(errorText);
                console.log("ERROR", errorText);
            });
        });
});

signButton.addEventListener('click', () =>  {
const data = {
    nickname: nickInput.value,
    password: passInput.value,
}

    fetch('https://battleshippro.herokuapp.com/register', {
        method: 'POST',
        mode: 'same-origin',
        headers: {
        'Content-Type':'application/json'
        },
        body:JSON.stringify(data)
    }).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw response.text();
    }).then((user) => {
        login(user);
        modalWrapper.style.display='none';
        navToGame();
    }).catch((error) => {
        error.then((errorText) => {
            alert(errorText);
            console.log("ERROR", errorText);
        });
    });
})
