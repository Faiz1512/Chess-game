const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index");
})

io.on("connection",(uniqueSocket)=>{
    console.log("connected......");

    if(!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerrole","w");
    }
    else if(!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerrole","b");
    }
    else {
        uniqueSocket.emit("spectator");
    }

    uniqueSocket.on("disconnect",()=>{
        if(uniqueSocket.id === players.white){
            delete players.white;
        } else if(uniqueSocket.id === players.black) {
            delete players.black;
        }
    })
    
    uniqueSocket.on("move",(move)=>{
        try{
            if(chess.turn === "w" && uniqueSocket.id !== players.white) return;//these two lines will keep check that black or white 
            if(chess.turn === "b" && uniqueSocket.id !== players.black) return;//should not move when the other player turn is there

            const result = chess.move(move);  //will throw an error if the move ie the given piece is moven an unvalid move
            if(result){
                currentPlayer = chess.turn;
                io.emit("move",move);//will send the correct to move to all the players and the spectators
                io.emit("boardState",chess.fen());//fen gives the current state of the board in an equation
            } else {
                console.log("invalidMove: ",move);
                uniqueSocket.emit("invalidMove",move);//will send the invalid move to the player
            }
        }
        catch(err){
            console.log(err);
            uniqueSocket.emit("Invalid move: ",move);
        }
    })
})

server.listen(3000,()=>{
    console.log("Server running on port 3000");
})