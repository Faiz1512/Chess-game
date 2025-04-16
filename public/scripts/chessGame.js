const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = ()=>{
    const board = chess.board();//this will give the chess squeares with what pieces they have on it in a 2d array form
    boardElement.innerHTML="";
    board.forEach((row,rowIndex)=>{
        row.forEach((square,squareIndex)=>{
            const squareElement = document.createElement("div");//this createas a new div which is not added in our file yet
            squareElement.classList.add("square",
                (rowIndex+squareIndex)%2==0?"light":"dark"//to get the light and dark squeares just like in chess
            )
            squareElement.dataset.row = rowIndex;//will add an attribute of data-row=rowIndex inside the div
            squareElement.dataset.column = squareIndex;

            if(square) {//ie if square is not null that is it has some piece on it
                const pieceElement = document.createElement("div");//creating a piece dynamically
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black")//give piece class white if color is white else black
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole===square.color;

                pieceElement.addEventListener("dragstart",(e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row:rowIndex,col:squareIndex};
                        e.dataTransfer.setData("text/plain","");//just something you need to add to avoid complications
                    }
                });
                pieceElement.addEventListener("dragend",(e)=>{
                    draggedPiece=null;
                    sourceSquare=null;
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("dragover",(E)=>{
                E.preventDefault();
            });
            squareElement.addEventListener("drop",(E)=>{// this is referring to the square where you're dropping the piece, not the square where you picked it up.
                E.preventDefault();
                const targetSource = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.column)
                }
                handleMove(sourceSquare,targetSource);
            })
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole=="b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }
}


const handleMove = (source,target)=>{
  const move = {
    from:`${String.fromCharCode(97+source.col)}${8-source.row}`,
    to:`${String.fromCharCode(97+target.col)}${8-target.row}`,
    promotion:'q'
  }

  socket.emit("move",move);
}

const getPieceUnicode = (piece) => {
    // Return the appropriate unicode based on the piece's color and type
    if (!piece) return ""; // If there is no piece, return empty string

    const pieceUnicode = {
        w: { // White pieces
            k: '\u2654', // King
            q: '\u2655', // Queen
            r: '\u2656', // Rook
            b: '\u2657', // Bishop
            n: '\u2658', // Knight
            p: '\u2659'  // Pawn
        },
        b: { // Black pieces
            k: '\u265A', // King
            q: '\u265B', // Queen
            r: '\u265C', // Rook
            b: '\u265D', // Bishop
            n: '\u265E', // Knight
            p: '\u265F'  // Pawn
        }
    };

    return pieceUnicode[piece.color]?.[piece.type] || ""; // Return unicode based on color and type
}

socket.on("playerrole",(role)=>{
    playerRole=role;
    renderBoard();
})

socket.on("spectator",()=>{
    playerRole=null;
    renderBoard();
})

socket.on("boardState",(fen)=>{
    chess.load(fen);
    renderBoard();
})

socket.on("move",(move)=>{
    chess.move(move);
    renderBoard();
})
renderBoard();