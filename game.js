var board;
var w = 10;
var h = 18;
var tbl;
var qtbl;
var gravspeed = 10;
var inputspeed = 2;
var tick = 0;
var queue = [];
var choice = ['i','j','l','o','s','t','z']
var nextPiece = {};
var holdPiece;
var canHold = true;
var lockDelay = 0;
var lockDelayDone = 50/gravspeed;
var score = 0;
var newline = [];
var pause = false;
for (var i = 0 ; i < w ; i++) {
    newline[i] = 0;
}

// left up right down
var keydown = [false,false,false,false]

var shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var randomPiece = function() {
    nextPiece.tetr = queue.shift();
    //queue.push(choice[Math.floor(Math.random()*choice.length)])
    if (6 > queue.length) {
        queue.push.apply(queue, shuffle(choice.slice(0)))
    }
    nextPiece.piece = pieces[nextPiece.tetr].map(function(arr) {
        return arr.slice();
    });
    nextPiece.rot = 0;
    nextPiece.x = Math.floor((w-nextPiece.piece[0].length)/2);
    nextPiece.y = 0;
    canHold = true;
}

var forAllCells = function(mino, callback) {
    for (var i = 0 ; i < mino.length ; i++ ) {
        for (var j = 0 ; j < mino.length ; j++) {
            if (1 == mino[i][j]) {
                callback (i,j);
            }
        }
    }
}

var contact = function(transform) {

    //var checking = transform($.extend(true, {}, nextPiece));
    var checking = transform(JSON.parse(JSON.stringify(nextPiece)));

    var contact = false;
    forAllCells(checking.piece,function(i,j) {
        if ( board[checking.y+i] == undefined ||
             //board[checking.y+i][checking.x+j] == 1 ||
             ["i","j","l","o","s","t","z",1].indexOf(board[checking.y+i][checking.x+j]) != -1 ||
             board[checking.y+i][checking.x+j] == undefined ) { //obstructed
            contact = true;
        }
    });
    return contact;
}

var attemptTransform = function(transform) {
    var checking = transform(JSON.parse(JSON.stringify(nextPiece)));
    var contact = false;
    forAllCells(checking.piece,function(i,j) {
        if ( board[checking.y+i] == undefined ||
             //board[checking.y+i][checking.x+j] == 1 ||
             ["i","j","l","o","s","t","z",1].indexOf(board[checking.y+i][checking.x+j]) != -1 ||
             board[checking.y+i][checking.x+j] == undefined ) { //obstructed
            contact = true;
        }
    });
    if (!contact) {
        transform(nextPiece);
        return true;
    }
}

var rotFn = [
    //transpose
    function(a) {
        return a[0].map(function(col, i) {
            return a.map(function(row) {
                return row[i]
            })
        });
    },
    //reverse rows
    function(a) {
        return a.map(function(arr) {
            return arr.reverse();
        });
    }

]

var rotate2d = function( array, dir ) {
    // 1  -> cw
    // -1 -> ccw
    return rotFn[(dir+1)/2](rotFn[1-(dir+1)/2](array));

}

var attemptRotate = function ( dir ) {
    (function(rot, dir) {
        switch (nextPiece.tetr) {
            case 'j':
            case 'l':
            case 's':
            case 't':
            case 'z':
                return wallkick[1][rot][dir];
                break;
            case 'i':
                return wallkick[2][rot][dir];
            default:
                return [0,0];
        }
    })(nextPiece.rot,(dir+1)/2).some(function ( test ) {
        return attemptTransform(function( mino ) {
            mino.piece = rotate2d(mino.piece,dir)
            mino.x += test[0];
            mino.y -= test[1];
            mino.rot = (((mino.rot+dir)%4)+4)%4;
            return mino;
        })
    })
}

var initBoard = function() {
    board = [];
    queue = [];
    // for (var i = 0 ; i < 5 ; i++ ) {
    //     queue.push(choice[Math.floor(Math.random()*choice.length)])
    // }
    queue.push.apply(queue, shuffle(choice.slice(0)))
    randomPiece();
    //holdPiece = {};
    for (var i = 0 ; i < h ; i++) {
        var row = [];
        for (var j = 0 ; j < w ; j++) {
            row[j] = 0;
        }
        board[i] = row;
    }
    tbl.innerHTML = "";
    for (var i = 0 ; i < h ; i++) {
        var tr = tbl.insertRow();
        for(var j = 0 ; j < w ; j++){
            var td = tr.insertCell();
            $(td).addClass('block');
        }
    }
    qtbl.innerHTML = "";
    for (var i = 0 ; i < 50 ; i++) {
        var tr = qtbl.insertRow();
        for(var j = 0 ; j < 10 ; j++){
            var td = tr.insertCell();
            $(td).addClass('small-block');
        }
    }

    // $("td").hover(function() {
    //     mouseCol = parseInt($(this).index()) + 1;
    // });
    drawQueue();
    drawHold();
}

var drawPiece = function( table, place, piece ) {
    var mino = pieces[piece].map(function(arr) {
        return arr.slice();
    });
    var h = mino.filter(function(ar) {
        return ar.indexOf(1) != -1; //has 1
    }).length;
    var w = mino[0].length;

    forAllCells(mino, function(i,j) {
        $(table.rows.item(6-h+2*i+place*10).cells.item(6-w+2*j)).attr("class","small-block " + piece);
        $(table.rows.item(6-h+2*i+place*10).cells.item(5-w+2*j)).attr("class","small-block " + piece);
        $(table.rows.item(5-h+2*i+place*10).cells.item(6-w+2*j)).attr("class","small-block " + piece);
        $(table.rows.item(5-h+2*i+place*10).cells.item(5-w+2*j)).attr("class","small-block " + piece);
    })
}

var drawQueue = function () {
    qtbl.innerHTML = "";
    for (var i = 0 ; i < 50 ; i++) {
        var tr = qtbl.insertRow();
        for(var j = 0 ; j < 10 ; j++){
            var td = tr.insertCell();
            $(td).addClass('small-block');
        }
    }
    for (var i = 0 ; i < 5 ; i++ ) {
        drawPiece(qtbl, i, queue[i]);
    }
}

var drawHold = function () {
    htbl.innerHTML = "";
    for (var i = 0 ; i < 10 ; i++) {
        var tr = htbl.insertRow();
        for(var j = 0 ; j < 10 ; j++){
            var td = tr.insertCell();
            $(td).addClass('small-block');
        }
    }
    if (holdPiece) {
        drawPiece(htbl, 0, holdPiece.tetr);
    }
}

var lockPiece = function() {
    lockDelay = 0;
    forAllCells(nextPiece.piece,function(i,j){
        board[i+nextPiece.y][j+nextPiece.x] = nextPiece.tetr;
    });

    // clear lines
    board = board.filter(function(row, ind) {
        return ( 0 != row.reduce(function(p, c) {
            return p + ((0 == c)?1:0);
        }, 0) )
    })

    // restock board
    while ( board.length < h ) {
        score++;
        board.unshift(newline.slice(0));
    }

    $("#score").text(score)

    // new piece
    randomPiece();
    drawQueue();
    if (contact(function(piece) {
        return piece;
    })) {
        //window.cancelAnimationFrame(exit);
        alert("you lost");
        initBoard();
    }
}

// rAF animate
var animate = function() {
    var exit = window.requestAnimationFrame( animate );

    // pause
    if ( keydown[27] ) { // esc
        $("#pause").toggle();
        pause = !pause;
        keydown[27] = false;
    }

    if (!pause) {
        // draw board
        for (var i = 0, row; row = tbl.rows[i]; i++) {
            for (var j = 0, col; col = row.cells[j]; j++) {
                switch (board[i][j]) {
                    case 2  :
                        $(col).attr("class","block " + nextPiece.tetr);
                        break;
                    case 0  :
                        $(col).attr("class","block empty");
                        break;
                    default :
                        $(col).attr("class","block " + board[i][j]);
                        break;
                }
            }
        }

        // update state
        if (gravspeed == tick) {
            // gravity
            attemptTransform(function(piece) {
                piece.y++;
                return piece;
            })

            // lock delay
            if (contact(function(piece) {
                piece.y++;return piece;
            })) {
                lockDelay++;
            } else {
                lockDelay = 0;
            }
            if (lockDelay > lockDelayDone) {
                lockPiece();
            }
            tick = 0;
        }
        tick++;


        // player input
        if ( tick % 5 == inputspeed ) {
            if ( keydown[37] ){ // left arrow
                attemptTransform(function(piece) {
                    piece.x--;
                    return piece;
                })
            }
            if ( keydown[39] ) { // right arrow
                attemptTransform(function(piece) {
                    piece.x++;
                    return piece;
                })
            }
            if ( keydown[40] ) { // down arrow
                attemptTransform(function(piece) {
                    piece.y++;
                    return piece;
                })
            }
        }

        if ( keydown[32] ) { // space
            while (!contact(function(piece) {
                piece.y++;return piece;
            })) {
                nextPiece.y++;
            }
            lockPiece();
            keydown[32] = false;
        }
        if ( keydown[88] ) { // x
            attemptRotate(-1);
            keydown[88] = false;
        }
        if ( keydown[90] ) { // z
            attemptRotate(1);
            keydown[90] = false;
        }
        if ( keydown[16] ) { // shift
            if (canHold) {
                if (holdPiece) { // hold exists
                    var tmp = JSON.parse(JSON.stringify(nextPiece));
                    nextPiece = JSON.parse(JSON.stringify(holdPiece));
                    nextPiece.piece = pieces[nextPiece.tetr].map(function(arr) {
                        return arr.slice();
                    });
                    nextPiece.rot = 0;
                    nextPiece.x = Math.floor((w-nextPiece.piece.length)/2);
                    nextPiece.y = 0;
                    holdPiece = JSON.parse(JSON.stringify(tmp));
                } else {
                    holdPiece = JSON.parse(JSON.stringify(nextPiece));
                    holdPiece.piece = pieces[holdPiece.tetr].map(function(arr) {
                        return arr.slice();
                    });
                    holdPiece.rot = 0;
                    holdPiece.x = Math.floor((w-holdPiece.piece.length)/2);
                    holdPiece.y = 0;
                    randomPiece();
                }
                canHold = false;
                drawHold();
            }
            keydown[16] = false;
        }



        // clear piece
        board.forEach(function(row, ri){
            row.forEach(function(col, ci) {
                if (2 == col) board[ri][ci] = 0;
            })
        })

        // replace piece
        forAllCells(nextPiece.piece,function(i,j){
            board[i+nextPiece.y][j+nextPiece.x] = 2;
        });
    }
}

//gogogo
$('html').click(function() {
    $(".cover").hide();
    // arrow keys
    $('body').on('keydown keyup', function(e) {
        keydown[e.which] = (e.type == "keydown" ? true : false);
    })

    tbl = document.getElementById("game");
    qtbl = document.getElementById("queue");
    htbl = document.getElementById("hold");
    $("#pause").css("display","none");
    initBoard();
    animate();
});
