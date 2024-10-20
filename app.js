const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app)
const io = socket(server)

const chess = new Chess();
let players = {};
let currentPlayer='w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    if (!players.white){
        players.white = socket.id;
        socket.emit('playerRole','w');
        
    }
    else if(!players.black){
        players.black = socket.id;
        socket.emit('playerRole','b');
    }
    else{
        players.spectator = socket.id;
        socket.emit('spectatorRole');
    }

    socket.on('disconnect',()=>{
        if(players.white === socket.id) delete players.white;
        if(players.black === socket.id) delete players.black;
        if(players.spectator === socket.id) delete players.spectator;
    })
    socket.on('game_over',(winner)=>{
        io.emit('game_over',winner)
    })
    socket.on('close',()=>{
        io.emit('close')
    })

    socket.on('move', (move) => {
        try{
            if(chess.turn() === 'w' && socket.id !== players.white) return;
            if(chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move)
            
            if(result){
                // console.log(result);
                let cap =result.captured
                let capColor =result.color
                currentPlayer = chess.turn()
                io.emit('move',move,cap,capColor)
                io.emit('boardState',chess.fen())
            }
            else{
                
                io.emit('invalidMove : ', move);
            }
        }
        catch(err){
            
            io.emit('invalidMove : ', move);

        }
    });
});

server.listen(3000);