document.addEventListener('DOMContentLoaded', () => {
    const leaderboardButton = document.querySelector('.leaderboard');
    const scoreContainer = document.querySelector('.score');
    const leaderboardWrapper = document.querySelector('.leaderboard-modal-wrapper');
    const closeBoardButton = document.querySelector('.close-button');
    // const closeBoardWrapper = document.querySelector('.modal');

    


    function getLeaderBoardData() {
        fetch('http://localhost:3000/score', {
            method: 'GET',
            mode: 'same-origin',
            headers: {
            'Content-Type':'application/json'
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw response.text();
        }).then(({scores}) => {
            const data = scores.reduce((acc, val) => {
                let record = acc.find((obj) => obj.nickname === val.nickname);
                if (record) {
                    record[val.mode] = val.score;
                }
                else {
                    acc.push({
                        nickname: val.nickname,
                        [val.mode]: val.score,
                    });
                }
                return acc;
            }, []);
            showData(data);
        }).catch((error) => {
            if(error.then)error.then((errorText) => {
                alert(errorText);
                console.log("ERROR", errorText);
            });
        });
    }

    function showData(data) {
        data.forEach(({nickname, multiplayer, singleplayer}) => {
            scoreContainer.innerHTML += `<div class="record-row"><span class="nickname">${nickname}</span><span class="multi">${multiplayer}</span><span class="single">${singleplayer}</span></div>`;
        });
    }

    getLeaderBoardData();

    leaderboardButton.addEventListener('click', () => {
        leaderboardWrapper.style.display = 'block';
    })

    closeBoardButton.addEventListener('click', () => {
        leaderboardWrapper.style.display = 'none';
    })
})

