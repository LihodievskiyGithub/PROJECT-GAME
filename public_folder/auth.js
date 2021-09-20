export function login(user) {
    window.localStorage.setItem('user', JSON.stringify(user));
}

export function logOut(user) {
    window.localStorage.removeItem('user');
}


export function isUserLoggedIn() {
    const json = window.localStorage.getItem('user');
    const user = JSON.parse(json);
    return !!(user && user._id);// true or false
}

export function getUserNickname() {
    const json = window.localStorage.getItem('user');
    const user = JSON.parse(json);
    return user && user.nickname;
}

export function getUserToken() {
    const json = window.localStorage.getItem('user');
    const user = JSON.parse(json);
    return user && user.token;
}

