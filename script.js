log("Script loaded");

var numbersTable = [];
var elementsTable = [];

var sizeX = 16*7;
var sizeY = 16*3;

var mineCount = 650;

var mouseDown = false;

/*
0-9 "non-mine," number represents bordering tiles
-1 mine
*/

const TILE_0 = 0;
const TILE_1 = 1;
const TILE_2 = 2;
const TILE_3 = 3;
const TILE_4 = 4;
const TILE_5 = 5;
const TILE_6 = 6;
const TILE_7 = 7;
const TILE_8 = 8;
const TILE_9 = 9;

const TILE_MINE = -1;

//Gets a random number, between OR INCLUDING the min and max values
function random(min, max)
{
    return Math.floor(Math.random() * ((max + 1) - min) + min);
}

//Entry point
window.onload = function()
{
    log("Page loaded");

    //Functions to monitor whether the mouse button is down or up.
    document.body.onmousedown = function() { mouseDown = true; }
    document.body.onmouseup = function() { mouseDown = false; }

    //Fills out the internal gameboard state
    for(var y = 0; y < sizeY; y++)
    {
        numbersTable[y] = [];
        for(var x = 0; x < sizeX; x++)
            numbersTable[y][x] = {value: 0, covered: true, flagged: false};
    }
    
    //TODO: This is poorly optimized. High mine saturation on large board may cause problems.
    //Place mines
    let minesPlaced = 0;
    while(minesPlaced < mineCount)
    {
        x = random(0, sizeX - 1);
        y = random(0, sizeY - 1);
        if(numbersTable[y][x].value != TILE_MINE)
        {
            numbersTable[y][x].value = TILE_MINE;
            //numbersTable[y][x].covered = false;
            minesPlaced++;
        }
    }

    //Places tile mine neighbor counts
    for(var x = 0; x < sizeX; x++)
        for(var y = 0; y < sizeY; y++)
            if(numbersTable[y][x].value != TILE_MINE)
            {
                var mines = getNeighborMineCount(x, y);
                numbersTable[y][x].value = mines;
            }

    //Create HTML elements
    createGameboard();
}

function getNeighborMineCount(tileX, tileY)
{
    var mineCount = 0;
    let neighbors = getNeighbors(tileX, tileY)
    for(var i = 0; i < neighbors.length; i++)
        if(numbersTable[neighbors[i].y][neighbors[i].x].value == TILE_MINE)
            mineCount++;
    return mineCount;
}

function getNeighborsElems(tileX, tileY)
{
    let neighbors = [];
    for(let x = tileX - 1; x <= tileX + 1; x++)
        for(let y = tileY - 1; y <= tileY + 1; y++)
            if(!(x == tileX && y == tileY) && (x >= 0) && (y >= 0) && (x < sizeX) && (y < sizeY))
                neighbors.push(elementsTable[y][x]);
    return neighbors;
}
function getNeighbors(tileX, tileY)
{
    let neighbors = [];
    for(let x = tileX-1; x <= tileX+1; x++)
        for(let y = tileY-1; y <= tileY+1; y++)
            if(!(x == tileX && y == tileY) && (x >= 0) && (y >= 0) && (x < sizeX) && (y < sizeY))
                neighbors.push({x: x, y: y});
    return neighbors;
}

//Visual function
function downify(elem)
{
    if(numbersTable[elem.y][elem.x].covered && !numbersTable[elem.y][elem.x].flagged)
        elem.style.backgroundPosition = "0px 0px"
}

//Visual function
function upify(elem)
{
    if(numbersTable[elem.y][elem.x].covered && !numbersTable[elem.y][elem.x].flagged)
        elem.style.backgroundPosition = "0px -16px"
}

//Visual function
function cellMouseDown(args)
{
    downify(args.target);
}

//Visual function
function cellMouseOver(args)
{
    if(mouseDown)
        downify(args.target);
}

//Visual function
function cellMouseOut(args)
{
    upify(args.target);
}

function cellContextMenu(args)
{
    return false;
}

function lose()
{
    for(var x = 0; x < sizeX; x++)
        for(var y = 0; y < sizeY; y++)
            numbersTable[y][x].covered = false;
}

//TODO: Functionality of "clicking" a tile
function cellMouseUp(args)
{
    var elem = args.target;
    var x = elem.x;
    var y = elem.y;
    upify(elem);

    if(args.which == 1)
    {
        if(!numbersTable[y][x].flagged)
        {
            numbersTable[y][x].covered = false;

            if(numbersTable[y][x].value == TILE_MINE)
                lose();

            function expose(x, y)
            {
                var neighbors = getNeighbors(x, y, true);
                for(var i = 0; i < neighbors.length; i++)
                {
                    if(numbersTable[neighbors[i].y][neighbors[i].x].value >= 0 && 
                        numbersTable[neighbors[i].y][neighbors[i].x].covered == true && 
                        !numbersTable[neighbors[i].y][neighbors[i].x].flagged)
                    {
                        numbersTable[neighbors[i].y][neighbors[i].x].covered = false;
                        if(numbersTable[neighbors[i].y][neighbors[i].x].value == 0)
                            expose(neighbors[i].x, neighbors[i].y);
                    }
                }
            }

            expose(x, y);
        }
    }
    else
    {
        if(numbersTable[y][x].covered)
            numbersTable[y][x].flagged = !numbersTable[y][x].flagged;
    }

    updateElems();
}

//Creates the table/elements for the gameboard
function createGameboard()
{
    for(var y = 0; y < sizeY; y++)
        elementsTable[y] = [];

        
    var gameTable = createElement("table", "game", document.body);

    for(let y = 0; y < sizeY; y++)
    {
        var row = createElement("tr", null, gameTable);
        for(let x = 0; x < sizeX; x++)
        {
            let cell = createElement("td", "cell", row);
            cell.onmousedown = cellMouseDown;
            cell.onmouseup = cellMouseUp;
            cell.onmouseover = cellMouseOver;
            cell.onmouseout = cellMouseOut;
            cell.oncontextmenu = cellContextMenu;
            elementsTable[y][x] = cell;
            //This may not be "legal," but it works- and improves performance
            cell.x = x; 
            cell.y = y;
        }
    }


    updateElems();

    //TODO: Re-enable
    /*
    var buttonSolve = createElement("button", null, document.body)
    buttonSolve.innerHTML = "Solve"
    buttonSolve.onclick = solve;
    var buttonSlowSolve = createElement("button", null, document.body)
    buttonSlowSolve.innerHTML = "Slow Solve"
    buttonSlowSolve.onclick = slowSolve;
    */
    var buttonReset = createElement("button", null, document.body)
    buttonReset.innerHTML = "Reset"
    buttonReset.onclick = reset;
};

//Updates the background off all elements based on their gameboard value
function updateElems()
{
    for(var x = 0; x < sizeX; x++)
        for(var y = 0; y < sizeY; y++)
        {
            elementsTable[y][x].style.backgroundPosition = (numbersTable[y][x].value * -16).toString() + "px 0px";
                    
            if(numbersTable[y][x].value == TILE_MINE)
                elementsTable[y][x].style.backgroundPosition = "-64px -16px";

            if(numbersTable[y][x].covered == true)
                if(numbersTable[y][x].flagged)
                    elementsTable[y][x].style.backgroundPosition = "-16px -16px";
                else
                    elementsTable[y][x].style.backgroundPosition = "0px -16px";
        }
}

//TODO: Implement
function reset()
{

}

//TODO: Implement
function makeAMove()
{
    

    return true;
}

//TODO: Implement
function solve()
{
    while(!checkComplete() && makeAMove()){}
    return checkComplete();
}

//TODO: Implement
function slowSolve()
{
    if(!checkComplete() && makeAMove())
        setTimeout(slowSolve, 0);
    else
        return checkComplete();
}

//TODO: Implement
//Returns true if the game is solved. Returns false otherwise.
function checkComplete()
{
    return false;
    return true;
}

//Creates an element of type elemType, sets className to className, and appends it as a child to parent
function createElement(elemType, className, parent)
{
    var elem = document.createElement(elemType);

    if(className)
        elem.className = className;

    if(parent)
        parent.appendChild(elem);

    return elem;
}

//Alias for console.log
function log(msg)
{
    console.log(msg);
}