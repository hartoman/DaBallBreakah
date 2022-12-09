// properties of the canvas for the laser
const canvas = document.querySelector('.daCanvas');//document.getElementById("theCanvas");
const ctx = canvas.getContext("2d");
const canvasHeight = canvas.height;// * 0.98;
const canvasMid = canvas.width / 2;
const canvasBoundingBox = canvas.getBoundingClientRect();

// title bar
const infoButton = document.getElementById("infoButton");
const helpButton = document.getElementById("helpButton");
//buttons that appear on the info-pages
const showInfo = document.getElementById("showInfo");
const showHelp = document.getElementById("showHelp");
const sendEmailButton = document.getElementById("sendEmailButton");
const restartButton = document.getElementById("restartButton");
// properties of the rest of the interface
// left side
const infoLabel1 = document.getElementById("newGame");            // message on-screen indicator 1
const infoLabel2 = document.getElementById("click2Start");        // message on-screen indicator 2
// right side
const levelLabel = document.getElementById("levelLabel");           // level on-screen counter
const linesLeftLabel = document.getElementById("linesLeftLabel");
const scoreLabel = document.getElementById("scoreLabel");
const ballPowerLabel = document.getElementById("ballPowerLabel");   // power on-screen counter
const ricochetLabel = document.getElementById("ricochetLabel");

// properties of the arena
const arena = document.querySelector('.middlePart'); //getElementById("middlePart");                    // the middle part of screen
const floor = arena.getBoundingClientRect().bottom * 0.97;              // arena floor height from top
const ceiling = arena.getBoundingClientRect().top * 1.08;               // arena ceiling
const rightBorder = arena.getBoundingClientRect().right;// * 0.98;         // right wall
const leftBorder = arena.getBoundingClientRect().left;// * 1.01;           // left wall
const midPoint = (rightBorder + leftBorder) / 2;                        // horizontal midpoint
const ball = document.getElementById("theBall");                        // ball

// fuctional variables
let rowIDcount;             // unique elementID of rows
let rowsByID = [];          // (String) array of the IDs of tiles in each row
let tileIDcount;            // unique elementID of rows
let tilesByID = [];         // (String) array of the IDs of tiles
let tilesInEachRow = [];    // keeps track of tiles remaining in a row
let mouseX;                 // the X mouse pointer coordinate
let mouseY;                 // the Y mouse pointer coordinate
let reverseOnceX = -1;        // ensures that ball will change direction upon hitting two tiles at once
let reverseOnceY = -1;        // ensures that ball will change direction upon hitting two tiles at once

// game variables
let level;                  // difficulty level of the game
let score;                  // score of the current game
let gameState;              // 0=paused, 1=unpaused 2=gameover 3=newGame
let dropSpeed = 1;          // the speed at which rows drop
let previousGameState = 0;  // remembers game state from which we go to infoscreens

//ball variables
let power;                  // ball power (how many hp damage deals with each collision)
let ballX;                  // ball center of mass X
let ballY;                  // ball center of mass Y
let angle;                  // angle between mouse pointer and ball center of mass (angle of motion)
let dx = 0;                 // horizontal motion 
let dy = 0;                 // vertical motion
let linesLeftForLevel = 0;  //number of lines that player still needs to destroy
let timeBetweenLineDrops = 5000;//

let speed;              // current speed of the ball
let ricochetCounter;    // every 100 ricochets goes back to zero and power increases
const initialBallSpeed = 7;//10;      // starting speed modifier
const maxSpeed = 20;        // maximum possible speed
const speedGainPerRicochet = 0.01;          // 1% dx or dy gain per ricochet

const timeUnit = 17;      // so that we can get 60 fps
const speedModifier = 25;  //multiplier

const chanceOfSpecial = 1;         // percent chance that a created tile is power up
const timeDecreaseBetweenLineDrops = 25;
const minimumTimeBetweenLineDrops = 2000;
const tilesize = window.outerHeight * 0.06;
const arenawidth = arena.getBoundingClientRect().width;
const tilesPerRow = ((rightBorder - leftBorder) / tilesize);

// animation for powerup + levelchange
const goThroughColors = [
    { color: 'red' },
    { color: 'yellow' },
    { color: 'blue' }
];
const goThroughColorsTiming = {
    duration: 1500,
    iterations: 1,
}


// BEGIN
// page loads
setGameState(3);    // state 3 = newGame
//3



/* ********* DURING PAUSE ********* */


/**Function that changes game state */
function setGameState(state) {

    switch (state) {
        // paused-ball on the floor
        case 0:
            gameState = 0;
            infoLabel1.innerHTML = "PAUSED";
            infoLabel2.innerHTML = "click to shoot";  // TODO: na anavosvhnei
            break;
        // running - ball on air
        case 1:
            gameState = 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            infoLabel1.innerHTML = "UNPAUSED";
            infoLabel2.innerHTML = "rows incoming";
            break;
        // game over    
        case 2:
            gameState = 2;
            infoLabel1.style.color = 'red';
            infoLabel1.innerHTML = "GAME OVER";
            infoLabel2.innerHTML = "click to retry";
            break;
        // initial state    
        case 3:
            newGame();
            break;
        // between levels    
        case 4:
            gameState = 4;
            level++;
            saveProgress();
            infoLabel1.innerHTML = "LEVEL COMPLETE";
            infoLabel2.innerHTML = "prepare for next level";
            setUpNextLevel();
            flashLabels();
            break;
        // displaying info-screens    
        case 5:
            // we save the other states to return to them while making sure that we do not create a loop
            if ((gameState != 5) && (gameState != 6)) {
                previousGameState = gameState;
            }
            gameState = 5;
            infoLabel1.innerHTML = "INFO";
            infoLabel2.innerHTML = "credits";
            canvas.style.visibility = 'hidden';
            ball.style.visibility = 'hidden';
            showInfo.style.visibility = 'visible';
            showHelp.style.visibility = 'hidden';
            break;
        case 6:
            if ((gameState != 5) && (gameState != 6)) {
                previousGameState = gameState;
            }
            gameState = 6;
            infoLabel1.innerHTML = "HELP";
            infoLabel2.innerHTML = "how to play";
            canvas.style.visibility = 'hidden';
            ball.style.visibility = 'hidden';
            showInfo.style.visibility = 'hidden';
            showHelp.style.visibility = 'visible';
    }

    // makes all labels flash at levelup
    function flashLabels() {
        infoLabel1.animate(goThroughColors, goThroughColorsTiming);
        infoLabel2.animate(goThroughColors, goThroughColorsTiming);
        levelLabel.animate(goThroughColors, goThroughColorsTiming);
        linesLeftLabel.animate(goThroughColors, goThroughColorsTiming);
        ballPowerLabel.animate(goThroughColors, goThroughColorsTiming);
        ricochetLabel.animate(goThroughColors, goThroughColorsTiming);
    }
}

/** sets up the initial game variables -corresponds to gameState 3 */
function newGame() {

    gameState = 0;
    loadProgress();
    setUpNextLevel();




}

function setUpNextLevel() {

    resetStandardParameters();
    setLevelDependendParameters();
    resetLabelColors();
    clearEmptyRows();
    resetBall();
    createMultipleRows(3);
    placeBall();
    printGameParameters();

    /** initializes starting level-independent parameters */
    function resetStandardParameters() {
        rowIDcount = 0;             // unique elementID of rows
        rowsByID = [];              // (String) array of the IDs of tiles in each row
        tileIDcount = 0;            // unique elementID of rows
        tilesByID = [];             // (String) array of the IDs of tiles
        tilesInEachRow = [];

        speed = initialBallSpeed * speedModifier / timeUnit;
        power = 1;
        dx = 0;
        dy = 0;
        ricochetCounter = 0;
    }
    /** initializes starting level-DEPENDENT parameters */
    function setLevelDependendParameters() {
        timeBetweenLineDrops = Math.max((timeBetweenLineDrops - level * timeDecreaseBetweenLineDrops), minimumTimeBetweenLineDrops);
        linesLeftForLevel = 2 + level;
    }
    /** resets the colors of all labels */
    function resetLabelColors() {
        infoLabel1.style.color = '';
        ricochetLabel.style.color = '';
        ballPowerLabel.style.color = '';
        ballPowerLabel.style.textShadow = '';
    }
    /** clears leftover empty rows from previous level */
    function clearEmptyRows() {
        const rows2Remove = document.querySelectorAll('.tileRow');
        rows2Remove.forEach(row => {
            row.remove();
        });
    }
    /** sets starting coordinates of the ball */
    function resetBall() {
        if ((ball.classList.contains('ball'))) {
            ball.className = '';
            ball.classList.add('ball');
            ball.classList.add('normalBall');
        }
        ball.style.boxShadow = '';

    }
}

/** saves the level to local storage */
function saveProgress() {
    localStorage.setItem('Level', level);
    localStorage.setItem('Score', score);
}

/** restores game from local storage */
function loadProgress() {
    if (localStorage.getItem('Level') === null) {
        level = 1;
    }
    else {
        const lvl = localStorage.getItem('Level');
        level = Number(lvl);
    }
    if (localStorage.getItem('Score') === null) {
        score = 0;
    }
    else {
        const scr = localStorage.getItem('Score');
        score = Number(scr);
    }
}

/** restarts the game from level 1 and score 0 */
restartButton.addEventListener('click',e=>{
    e.stopImmediatePropagation();
    localStorage.clear();
    restartButton.innerHTML='PROGRESS CLEARED, RELOAD PAGE';
})

/** sets starting coordinates of the ball */
function placeBall() {

    // place the ball in the middle of the floor
    let startingBallY = `${floor}px`;
    ball.style.top = startingBallY;     // it has to be top!

    let adjust = ball.getBoundingClientRect().width / 2;
    let startingBallX = `${midPoint - adjust}px`;
    ball.style.left = startingBallX;
}

/** prints on-screen the relevant information */
function printGameParameters() {

    levelLabel.innerHTML = level;
    linesLeftLabel.innerHTML = linesLeftForLevel;
    scoreLabel.innerHTML = score;
    ballPowerLabel.innerHTML = power;

    if (power >= 999) {
        ballPowerLabel.style.color = 'white';
        ballPowerLabel.style.textShadow = "0px 0px 5px yellow, 0px -5px 5px red";
    }

    ricochetLabel.innerHTML = ricochetCounter;
}

/** takes to info screen */
infoButton.addEventListener('click', e => {
    e.stopImmediatePropagation();
    setGameState(5);
})
/** takes to help screen */
helpButton.addEventListener('click', e => {
    e.stopImmediatePropagation();
    setGameState(6);
})
/** takes back to main */
document.addEventListener('click', () => {
    if ((gameState == 5) || (gameState == 6)) {
        showInfo.style.visibility = 'hidden';
        showHelp.style.visibility = 'hidden';
        canvas.style.visibility = 'visible';
        ball.style.visibility = 'visible';
        setGameState(previousGameState);
    }
})

/** displays the laser on the canvas when the game is paused    */
function rotateLaser(e) {

    // visible only when paused
    if ((gameState == 0) || (gameState == 4)) {

        // gets positions of x and y based on whether device is touchscreen
        getXYpositions(e);

        // canvas has pixel size and css size
        // must normalize mouse coordinates to canvas pixel size 
        let x = normalizeX(mouseX);
        let y = normalizeY(mouseY);

        // clears canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // get coordinates of the center of the ball, and normalize them 
        ballX = (ball.getBoundingClientRect().left + ball.getBoundingClientRect().right) / 2;
        ballY = (ball.getBoundingClientRect().top + ball.getBoundingClientRect().bottom) / 2;
        let bx = normalizeX(ballX);
        let by = normalizeY(ballY);

        // set up the drawing of the line
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        ctx.beginPath();

        // draw a line between center of the ball and mouse pointer
        ctx.moveTo(bx, by);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    /** normalizes X value to a given canvas*/
    // credits: https://codepen.io/andyranged/pen/KyMKEB
    function normalizeX(x) {
        return (x - canvasBoundingBox.left) * (ctx.canvas.width / canvasBoundingBox.width);
    }
    /** normalizes Y value to a given canvas */
    // credits: https://codepen.io/andyranged/pen/KyMKEB
    function normalizeY(y) {
        return (y - canvasBoundingBox.top) * (ctx.canvas.height / canvasBoundingBox.height);
    }
}

/** gets positions of x and y based on whether device is touchscreen  */
function getXYpositions(e) {

    if ((is_touch_enabled()) && (e.touches.length > 0)) {
        // credits: https://www.w3schools.com/jsref/event_touch_touches.asp

        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }

    else {
        mouseX = e.pageX;
        mouseY = e.pageY;
    }
}
// to display laser move mouse or touch screen
canvas.addEventListener('mousemove', rotateLaser);
canvas.addEventListener('touchmove', rotateLaser);
canvas.addEventListener('touchstart', rotateLaser);

/** returns true if device is touchscreen
 * credits: https://www.geeksforgeeks.org/how-to-detect-touch-screen-device-using-javascript/
 */
function is_touch_enabled() {
    return ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);
}

/**what happens when mouse is clicked 
 * @param {Event} e - mouse clicked
 */
function onMouseClick(e) {
    switch (gameState) {
        case 0:             //paused
        case 4:             //prepare for next level
            // in case player clicks without having moved the mouse
            if (!is_touch_enabled()) {
                rotateLaser(e);
            }

            shoot();   // start action
            break;
        case 2:          // game over and retry from current level
            score = 0;
            level--;
            setGameState(0);
            setUpNextLevel();
    }
}
// shoot by clicking or when removing finger from screen
canvas.addEventListener('click', onMouseClick);
canvas.addEventListener('touchend', onMouseClick);

/** shoots in the direction of mouse pointer */
function shoot() {

    // calculates the angle of the ball motion 
    calcAngle();
    // clears canvas from the laser
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // unpauses the game
    setGameState(1);

    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dx = calcMovement(dx);
    dy = -calcMovement(dy);

    // calculates the speed for the given direction
    function calcMovement(direction) {
        return direction * speed;
    }

    // calculates the angle of the ball motion
    // credits: https://gist.github.com/conorbuck/2606166
    function calcAngle() {

        angle = -Math.atan2(mouseY - ballY, mouseX - ballX);

    }

}



/* ********* DURING GAME RUNNING ********* */


/* **** CREATING ROWS OF TILES **** */

/** timer for new row creation */
function timedRowDrop() {
    if ((gameState == 1)) {

        if (linesLeftForLevel > 0) {
            createRow();
        }
        else {
            createEmptyRow();
        }
        // every time that a new line is formed check for game over
        checkForGameOver();
    }
}
const rowTimer = setInterval(timedRowDrop, (timeBetweenLineDrops / dropSpeed));

/** drops multiple non-empty rows at the beginning of a level  */
function createMultipleRows(numRows) {

    for (let i = 0; i < numRows; i++) {      // at 13 it is game over
        createRow();
    }

}

/** creates a single non-empty row */
function createRow() {

    // new row is created
    let row = document.createElement("div");
    row.classList.add("tileRow");

    // gets unique id
    rowIDcount++;
    let rowId = 'row' + rowIDcount;
    row.setAttribute("id", rowId);

    // counter for number of non-empty tiles the new row contains
    let tilesInRow = 0;

    // fill row 
    for (let i = 0; i < tilesPerRow; i++) {
        let exist = randomBetween(0, 1);

        if (exist) {

            let tile;


            let itsPowerUp = randomBetween(1, 100);
            if (itsPowerUp <= chanceOfSpecial) {
                tile = createSpecialTile();
            } else {
                // create, color and prepend new tile, increase tile counter 
                tile = createTile(randomBetween(1, level));
            }
            tile.classList.add('Tile');
            row.prepend(tile);
            tilesInRow++;
        }
        else {
            // fill the space with an empty-tile
            let empty = createEmptyTile();
            row.prepend(empty);
        }

    }
    // add new elements to arrays of tile-counters and row-ids
    tilesInEachRow.push(tilesInRow);
    rowsByID.push(rowId);
    // add to the html
    arena.prepend(row);
    //
    linesLeftForLevel--;


}

/** creates empty rows as filler for the end of each level */
function createEmptyRow() {

    let row = document.createElement("div");
    row.classList.add("tileRow");
    // gets unique id
    rowIDcount++;
    arena.prepend(row);

}

/** creates a signle non-empty,non-special tile
 * @param {int} hitpoints - the hits required for the tile to be destroyed
 */
function createTile(hitPoints) {
    // new tile is created
    let tile = document.createElement("div");
    tile.classList.add('basicTile');

    // gets unique id
    tileIDcount++;
    let tileId = 'tile' + tileIDcount;
    tile.setAttribute("id", tileId);

    // assign hp and color the tile
    tile.innerHTML = hitPoints;
    colorTile(tile);

    // add to array
    tilesByID.push(tile);
    return tile;
}

/** creates a signle empty tile as filler for the rows*/
function createEmptyTile() {
    let emptiness = document.createElement("div");
    emptiness.classList.add("Tile");
    emptiness.classList.add("emptyTile");
    return emptiness;
}

/** colorizes the tile based on its hit point value
 * @param {Element} tile - a div with css class 'tile'
*/
function colorTile(tile) {

    let hp = Number(tile.innerHTML) % 10;

    switch (hp) {

        case 1:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, indigo)";
            tile.style.borderColor = "purple";
            break;
        case 2:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, mediumblue)";
            tile.style.borderColor = "lightskyblue";
            break;
        case 3:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, dodgerblue)";
            tile.style.borderColor = "darkslateblue";
            break;
        case 4:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, lawngreen)";
            tile.style.borderColor = "darkgreen";
            break;
        case 5:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, gold)";
            tile.style.borderColor = "goldenrod";
            break;
        case 6:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, orange)";
            tile.style.borderColor = "goldenrod";
            break;
        case 7:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, red)";
            tile.style.borderColor = "tomato";
            break;
        case 8:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, sienna)";
            tile.style.borderColor = "saddlebrown";
            break;
        case 9:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, slategray)";
            tile.style.borderColor = "silver";
            break;
        case 0:

            tile.style.backgroundImage = "radial-gradient(closest-corner at 20% 20%, white, black)";
            tile.style.borderColor = "white";
            break;
    }

}

/** creates a signle special tile*/
function createSpecialTile() {

    // if we get a special tile, 10% of the time it will be fireball (gives max power)
    let chanceOfFireball = randomBetween(1, 10);
    let tile;
    if (chanceOfFireball <= 1) {
        tile = createFireTile();
    } else {
        tile = createPowerUpTile();
    }

    // gets unique id
    tileIDcount++;
    let tileId = 'tile' + tileIDcount;
    tile.setAttribute("id", tileId);
    // add to array
    tilesByID.push(tile);

    return tile;

    /** creates a signle power-up tile*/
    function createPowerUpTile() {
        // new tile is created
        let tile = document.createElement("div");
        tile.classList.add("powerUpTile");
        // assign hp and color the tile
        tile.innerHTML = 'UP';
        return tile;
    }

    /** creates a signle fireball tile*/
    function createFireTile() {
        // new tile is created
        let tile = document.createElement("div");
        tile.classList.add("fireTile");
        // assign hp and color the tile
        tile.innerHTML = 'F';
        return tile;
    }
}

/** if there is game over switches the game to the corresponding state -2 */
function checkForGameOver() {

    const bottomRowId = rowsByID[0];
    const bottomRow = document.getElementById(bottomRowId);

    if (bottomRow.getBoundingClientRect().bottom >= floor) {
        console.log("game over");
        setGameState(2);
    }
}

/* **** DESTROYING **** */


/** everything that happens during a time unit*/
function moveBall() {

    // if game is running
    if (gameState == 1) {

        // calculate temporary possible next ball position, to test against glitches
        var signX = Math.sign(dx);
        var tmpDdx = signX * Math.abs(dx);
        var signY = Math.sign(dy);
        var tmpDdy = signY * Math.abs(dy)
        var rectXL = ball.getBoundingClientRect().left + tmpDdx;
        var rectXR = ball.getBoundingClientRect().right + tmpDdx;
        var rectY = ball.getBoundingClientRect().top + tmpDdy;

        // checks that the ball stays within bounds
        checkWallCollision();
        // checks if ball hits a tile
        checkTileCollision();

        // calculate definite ball position and move ball
        rectXL = ball.getBoundingClientRect().left + dx;
        rectY = ball.getBoundingClientRect().top + dy;
        let moveX = `${rectXL}px`;
        let moveY = `${rectY}px`;
        ball.style.left = `${moveX}`;
        ball.style.top = `${moveY}`;

        // if firebal, there is a comet tail
        if (ball.classList.contains('fireBall')) {
            let shadowX = -Math.sign(dx);
            let shadowY = -Math.sign(dy);
            ball.style.boxShadow = `${shadowX * 1}px ${shadowY * 1}px 3px 1px yellow, ${shadowX * 2}px ${shadowY * 2}px 3px 2px orange,${shadowX * 3}px ${shadowY * 3}px 3px 3px red`;
        }

        /* these ensure that the ball will only be reversed once each frame
         to avoid double-reverse when hitting 2 tiles at once*/
        reverseOnceX = -1;
        reverseOnceY = -1;
    }

    /** what happens when ball collides with walls or the floor */
    function checkWallCollision() {
        /* check beforehand if the next frame position will take a super-fast ball 
        out of the border and if so, correct the dx,dy to avoid accidental no-clip bugs */
        if ((rectXR >= rightBorder) || (rectXL <= leftBorder)) {
            dx = accelerateBall(-1, tmpDdx);
        }
        if ((rectY <= ceiling)) {
            dy = accelerateBall(-1, tmpDdy);
        }
        if ((rectY >= floor)) {
            dy = accelerateBall(-1, tmpDdy);

            // if player empties the arena, up to 3 lines appear at once
            if ((rowsByID.length == 0) && (linesLeftForLevel > 0)) {
                let rowsToCreate = Math.min(3, linesLeftForLevel);
                createMultipleRows(rowsToCreate);
                linesLeftForLevel = Math.max(linesLeftForLevel, 0);
                printGameParameters();
            }

            setGameState(0);
        }
    }

    /** checks every tile for collision with ball */
    function checkTileCollision() {

        tilesByID.forEach(tile => {
            if (elementsOverlap(tile, ball)) {
                collisionWithTile(tile);
            }
        });
    }

    /** if the ball collides with a tile
     *@param {Element} tile - a div with css class 'tile'
    */
    function collisionWithTile(tile) {

        // we get the differences between the borders of the ball and of the tile
        let difXL = Math.abs((ball.getBoundingClientRect().right - tile.getBoundingClientRect().left));
        let difXR = Math.abs((ball.getBoundingClientRect().left - tile.getBoundingClientRect().right));
        let difYT = Math.abs(ball.getBoundingClientRect().bottom - tile.getBoundingClientRect().top);
        let difYB = Math.abs(ball.getBoundingClientRect().top - tile.getBoundingClientRect().bottom);

        // we choose the smallest for each axis
        let differenceX = Math.min(difXL, difXR);
        let differenceY = Math.min(difYT, difYB);

        /* the smallest difference indicates on which axis we have collision
           on equality, we 'give' it to the x axis, so that the game keeps on flowing  */

        // collision on X axis
        if (differenceX <= differenceY) {
            dx = accelerateBall(reverseOnceX, dx);
            reverseOnceX = 1;
        }
        // collision on Y axis
        else {
            dy = accelerateBall(reverseOnceY, dy);
            reverseOnceY = 1;
        }

        // reduce hp of a tile.
        let hp = Number(tile.innerHTML);
        hp = hp - power;

        // isNaN in case of powerups 
        const isSpecialTile = isNaN(hp);

        if (hp < 0) {
            hp = 0;
        }
        // if there is no hp left or if the tile is special, it is destroyed
        if ((hp == 0) || isSpecialTile) {
            let id = tile.id;
            destroyTile(tile);
            if (isSpecialTile) {
                let tileType = tile.classList[0];
                switch (tileType) {
                    case 'powerUpTile':
                        powerUpBall();
                        break;
                    case 'fireTile':
                        makeFireBall();
                        break;
                }

            }
        }
        // else it is recolored
        else {
            tile.innerHTML = hp;
            colorTile(tile);
        }
        //increases score with every collision
        score++;
    }


    /** accelerates the ball towards a direction
     * @param {int} mod the modifier +-1 of the direction that the ball will take next
     * @param {int} direction the current direction dx or dy
     */
    function accelerateBall(mod, direction) {

        // changes direction dx or dy facing towards the side indicated by mod and adds a bit of speed
        direction = mod * (direction + Math.sign(direction) * speedGainPerRicochet);


        //  recalculates speed through pythagorean theorem, placing a limit of maxSpeed
        if (speed < maxSpeed) {
            speed = Math.max(Math.sqrt(dx * dx + dy * dy), speed);
        }

        // every 100 ricochets the ball gains powerup
        ricochetCounter++;
        if (ricochetCounter % 100 == 0) {
            powerUpBall();
        }

        printGameParameters();
        return direction;
    }
}
const ballTime = setInterval(moveBall, timeUnit);

/** if a tile reaches 0 hp  
 * @param {Element} tile - a div with css class 'tile'
*/
function destroyTile(tile) {

    let tileId = tile.id;
    let rowId = document.getElementById(tileId).parentElement.id;

    // replace tile with empty-space type (invisible tile) and play a short explosion
    let empty = createEmptyTile();
    tile.replaceWith(empty);
    displayExplosionEffect(empty);

    // wee check if there are any non-empty tiles remaining
    let index = rowsByID.indexOf(rowId);
    tilesInEachRow[index]--;
    const tilesRemainingInRow = document.getElementById(rowId).getElementsByClassName('basicTile').length;

    // if by the destruction of the tile we end up with an empty row, we clear it
    if ((tilesRemainingInRow <= 0)) {
        destroyRow(rowId);
    }

    /** displays a short animation on the tile
     * @param {Element} emptyTile - a div with css class 'emptyTile'
     */
    function displayExplosionEffect(emptyTile) {

        const destoyedByNormalBall = [
            { backgroundColor: 'white' },
            { color: 'white' }
        ];

        const destroyedByFireBall = [
            { background: 'radial-gradient(closest-side at 50% 50%, orange,red)' },
            { color: 'red' }
        ];

        // special animation for the fireball
        if (ball.classList.contains('fireBall')) {
            emptyTile.animate(destroyedByFireBall, 300);
        } else {
            emptyTile.animate(destoyedByNormalBall, 200);
        }

    }
}

/** when there are no more non-empty tiles in a row
 * @param {String} id the ElementId of the row
*/
function destroyRow(id) {

    // if it is the bottom-most row
    // remove all empty rows from bottom to top
    while (tilesInEachRow[0] <= 0) {

        // from html
        let idToRemove = rowsByID[0];

        document.getElementById(idToRemove).remove();
        // from both arrays
        tilesInEachRow.shift();
        rowsByID.shift();
    }

    // if this shot finishes up all the remaining tiles of this leevel
    if ((linesLeftForLevel <= 0) && (rowsByID.length <= 0)) {
        setGameState(4);
    }
}

/** when the ball gains a power up */
function powerUpBall() {

    // increase power
    if (power < 999) {
        power++;
    }

    // increase speed if it is not fireball (because the speed of fireball goes beyond max)
    if (!ball.classList.contains('fireBall')) {
        speed = (speed < maxSpeed) ? (speed + 1) : maxSpeed;
    }
    printGameParameters();
    ballPowerLabel.animate(goThroughColors, goThroughColorsTiming);

    // display a short animation on the ball 
    powerUpBallAnimation();

    // swaps ball graphics for a short amount of time
    function powerUpBallAnimation() {
        ball.classList.remove('normalBall');
        ball.classList.add('ballPoweringUp');
        const ballColorChange = setTimeout(() => {
            ball.classList.remove('ballPoweringUp');
            ball.classList.add('normalBall');
        }, 1000);
    }
}

/** if ball hits a fireball-tile */
function makeFireBall() {
    // gains max power
    power = 999;
    // gains speed beyond the maximum
    speed = maxSpeed * 1.1;
    // swap ball graphics
    ball.classList.remove('normalBall');
    ball.classList.add('fireBall');
    printGameParameters();
}

/** generates random number between-including min and max 
 * @param {int} min bottom number, included
 * @param {int} max top number, included
 * */
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** checks if two elements overlap-for collisions
 credits: https://bobbyhadz.com/blog/javascript-check-if-two-elements-overlap */
function elementsOverlap(el1, el2) {
    const domRect1 = el1.getBoundingClientRect();
    const domRect2 = el2.getBoundingClientRect();

    return !(
        domRect1.top > domRect2.bottom ||
        domRect1.right < domRect2.left ||
        domRect1.bottom < domRect2.top ||
        domRect1.left > domRect2.right
    );
}
