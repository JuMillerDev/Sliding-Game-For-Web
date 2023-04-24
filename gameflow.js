var URL = window.webkitURL || window.URL;
var rows = 0;
var cols = 0;
var canvas;
var iw;
var file;
var ih;
var ctx;
var url;
var tileHeight;
var tileWidth;
var gameStarted;
var tiles = [];
var highlightedTile = { row: -1, col: -1 };
var goalState = [];
var emptyTile = { row: 0, col: 0 };
var tempTilePhoto;
var imagePassed = false;

window.onload = function () {
    gameStarted = false;
    var img = document.getElementById("img");
    img.addEventListener("change", handleImg, false);
    canvas = document.getElementById("canvas");
    canvas.width = canvas.getBoundingClientRect().width;
    canvas.height = canvas.getBoundingClientRect().height;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.addEventListener("click", onTileClick);

    if (localStorage.getItem("visited") != null && localStorage.getItem("gameStarted") === "true") {
        recoverGameState();
    }

    localStorage.setItem("visited", "true");
};

window.onbeforeunload = function () {
    if (gameStarted) {

        localStorage.setItem("gameStarted", "true");
        localStorage.setItem("tiles", JSON.stringify(tiles));
        localStorage.setItem("goalState", JSON.stringify(goalState));
        localStorage.setItem("row/col", rows);

        var reader = new FileReader();
        reader.addEventListener("load", function () {
            localStorage.setItem("imageURL", reader.result);
        }, false);
        reader.readAsDataURL(file);
    } else {
        localStorage.setItem("gameStarted", "false");
    }
}

function recoverGameState() {
    gameStarted = true;
    tiles = JSON.parse(localStorage.getItem("tiles"));
    goalState = JSON.parse(localStorage.getItem("goalState"));
    rows = cols = parseInt(localStorage.getItem("row/col"));

    url = localStorage.getItem("imageURL");

    var img = new Image();
    img.onload = function () {
        ctx.drawImage(img,
            0, 0, canvas.width, canvas.height);
        restoreTiles(img);
    };
    img.src = url;
}

function restoreTiles(img) {
    iw = canvas.width = img.width;
    ih = canvas.height = img.height;
    tileWidth = iw / cols;
    tileHeight = ih / rows;

    i = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            var t = tiles[i++];
            if (t.numb == 0) {
                ctx.fillStyle = "#0077b6";
                ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                emptyTile.col = x;
                emptyTile.row = y;
                continue;
            }
            ctx.drawImage(img, t.col * tileWidth, t.row * tileHeight, tileWidth, tileHeight,
                x * tileWidth, y * tileHeight, tileWidth, tileHeight);

            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * tileWidth, y * tileHeight, tileWidth - 1, tileHeight - 1);
        }
    }

    console.log(tiles);
}

function handleImg(e) {
    imagePassed = true;
    file = e.target.files[0];
    url = URL.createObjectURL(e.target.files[0]);
}

function startGame() {
    if (gameStarted) {
        window.alert("Game is already started. Please click Restart");
        return false;
    }
    if (rows == 0 || imagePassed == false) {
        window.alert("Please fill all Options");
        return false;
    }

    gameStarted = true;
    var divisor = document.getElementById("rows/cols").value;
    rows = (divisor * 1);
    cols = (divisor * 1);

    var img = new Image();
    img.onload = function () {
        ctx.drawImage(img,
            0, 0, canvas.width, canvas.height);
        addTiles(img);
    };
    img.src = url;

    return false;
}


function addTiles(rimg) {
    tiles = []

    iw = canvas.width = rimg.width;
    ih = canvas.height = rimg.height;
    tileWidth = iw / cols;
    tileHeight = ih / rows;

    var i = 1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (y == 0 && x == 0) {
                continue;
            }
            tiles.push({ row: y, col: x, numb: i });
            goalState.push({ row: y, col: x, numb: i });
            i++;
        }
    }

    ctx.fillStyle = "#0077b6";
    ctx.fillRect(0, 0, tileWidth, tileHeight);

    shuffleTiles(tiles);

    i = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (x == 0 && y == 0) {
                continue;
            }

            var t = tiles[i++];

            ctx.drawImage(rimg, t.col * tileWidth, t.row * tileHeight, tileWidth, tileHeight,
                x * tileWidth, y * tileHeight, tileWidth, tileHeight);

            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * tileWidth, y * tileHeight, tileWidth - 1, tileHeight - 1);
        }
    }

    tiles.unshift({ col: 0, row: 0, numb: 0 });
    goalState.unshift({ col: 0, row: 0, numb: 0 });
    console.log(tiles);
}

function shuffleTiles(tiles) {
    tiles.sort((a, b) => 0.5 - Math.random());
    if (!isSolvable()) {
        shuffleTiles(tiles);
    }
}

function onTileClick(e) {
    if (!gameStarted) {
        return;
    }

    var rect = canvas.getBoundingClientRect();

    var x = e.pageX - rect.left;
    var y = e.pageY - rect.top;

    var element_row = parseInt(y / (rect.height / rows));
    var element_col = parseInt(x / (rect.width / cols));
    var nearBlank = checkNearBlank(element_col, element_row);
    var index = element_row * cols + element_col;


    if (nearBlank > 0) {
        switch (nearBlank) {
            case 1:
                arrayMove(index, index + 3);
                break;
            case 2:
                arrayMove(index, index - 3);
                break;
            case 3:
                arrayMove(index, index + 1);
                break;
            case 4:
                arrayMove(index, index - 1);
                break;
            default:
                break;
        }

        var imageData = ctx.getImageData(element_col * tileWidth, element_row * tileHeight, tileWidth + 1, tileHeight + 1);
        ctx.putImageData(imageData, emptyTile.col * tileWidth, emptyTile.row * tileHeight);
        ctx.strokeStyle = "black";
        ctx.strokeRect(emptyTile.col * tileWidth, emptyTile.row * tileHeight, tileWidth - 1, tileHeight - 1);


        ctx.fillStyle = "#0077b6";
        ctx.fillRect(element_col * tileWidth, element_row * tileHeight, tileWidth, tileHeight);

        emptyTile.col = element_col;
        emptyTile.row = element_row;

        tempTilePhoto = null;

        if (JSON.stringify(tiles) == JSON.stringify(goalState) && emptyTile.col == 0 && emptyTile.row == 0) {
            setTimeout(function () { window.alert("You Won"); }, 1000);
            gameStarted = false;
        }
    }
}

function arrayMove(oldIndex, newIndex) {

    let tempOld = tiles[oldIndex];
    let tempNew = tiles[newIndex];

    tiles[oldIndex] = tempNew;
    tiles[newIndex] = tempOld;
}

function isSolvable() {
    var inv = countInversions();

    if (cols % 2 == 0) {
        return (inv % 2 == 1);
    }

    return (inv % 2 == 0);
}

function countInversions() {
    var invCount = 0;


    for (let i = 0; i < tiles.length - 1; i++) {
        for (let j = i + 1; j < tiles.length; j++) {

            if (tiles[i].numb > 0 && tiles[j].numb > 0 && tiles[i].numb > tiles[j].numb) {
                invCount++;
            }
        }
    }

    return invCount;
}

function highlightTiles(e) {
    if (!gameStarted || nearBlank == 0) {
        return;
    }

    var rect = canvas.getBoundingClientRect();

    var x = e.pageX - rect.left;
    var y = e.pageY - rect.top;
    var element_row = parseInt(y / (rect.height / rows));
    var element_col = parseInt(x / (rect.width / cols));

    var nearBlank = checkNearBlank(element_col, element_row);

    if (tempTilePhoto && highlightedTile.col > -1 && (element_row != highlightedTile.row || element_col != highlightedTile.col)) {
        ctx.clearRect(highlightedTile.col * tileWidth, highlightedTile.row * tileHeight, tileWidth, tileHeight);
        ctx.putImageData(tempTilePhoto, highlightedTile.col * tileWidth, highlightedTile.row * tileHeight);
        ctx.strokeStyle = "black";
        ctx.strokeRect(highlightedTile.col * tileWidth, highlightedTile.row * tileHeight, tileWidth - 1, tileHeight - 1);
    }

    if (nearBlank > 0) {
        tempTilePhoto = ctx.getImageData(element_col * tileWidth, element_row * tileHeight, tileWidth, tileHeight);
        ctx.strokeStyle = "white";
        ctx.strokeRect(element_col * tileWidth, element_row * tileHeight, tileWidth - 1, tileHeight - 1);

        highlightedTile.row = element_row;
        highlightedTile.col = element_col;
    }
}

function checkNearBlank(col, row) {
    if (emptyTile.col == col && emptyTile.row - 1 == row) {
        //the chosen tile is above blank tile
        return 1;
    } else if (emptyTile.col == col && emptyTile.row + 1 == row) {
        //the chosen tile is below blank tile
        return 2;
    } else if (emptyTile.row == row && emptyTile.col - 1 == col) {
        //the chosen tile is to the left from the blank tile
        return 3;
    } else if (emptyTile.row == row && emptyTile.col + 1 == col) {
        //the chosen tile is to the right from the blank tile
        return 4;
    }
    return 0;
}

function dehighlightTiles() {
    if (!gameStarted || (highlightedTile.col == emptyTile.col && highlightedTile.row == emptyTile.row)) {
        tempTilePhoto = null;
        return;
    }
    ctx.clearRect(highlightedTile.col * tileWidth, highlightedTile.row * tileHeight, tileWidth, tileHeight);
    ctx.putImageData(tempTilePhoto, highlightedTile.col * tileWidth, highlightedTile.row * tileHeight);
    ctx.strokeStyle = "black";
    ctx.strokeRect(highlightedTile.col * tileWidth, highlightedTile.row * tileHeight, tileWidth - 1, tileHeight - 1);
}

function restartGame() {
    gameStarted = false;
    imagePassed = false;
    emptyTile.col = 0;
    emptyTile.row = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tiles = [];
    goalState = [];
}