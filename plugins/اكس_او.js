// plugins/game-ttt.js
// Hammam Bot- لعبة إكس أو (Tic Tac Toe) ❌⭕

import { theme } from '../core/theme.js';

class TicTacToe {
    constructor(playerX = 'x', playerO = 'o') {
        this.playerX = playerX;
        this.playerO = playerO;
        this.board = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.currentTurn = playerX;
        this.winner = null;
    }

    render() {
        return this.board.map(cell => {
            if (cell === 'X') return 'X';
            if (cell === 'O') return 'O';
            return cell;
        });
    }

    turn(player, pos) {
        if (this.winner) return false;
        if (player !== this.currentTurn) return false;
        if (pos < 0 || pos > 8) return false;
        if (typeof this.board[pos] !== 'number') return false;
        
        this.board[pos] = player === this.playerX ? 'X' : 'O';
        this.currentTurn = player === this.playerX ? this.playerO : this.playerX;
        
        this.checkWinner();
        return true;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winner = this.board[a] === 'X' ? this.playerX : this.playerO;
                return;
            }
        }
        
        if (this.board.every(cell => typeof cell !== 'number')) {
            this.winner = 'draw';
        }
    }
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
    conn.game = conn.game ? conn.game : {};

    // 🛑 أمر الإلغاء والخروج من اللعبة المعلقة
    if (text === 'الستغناء' || text === 'خروج' || text === 'انهاء' || text === 'انسحاب') {
        let room = Object.values(conn.game).find(room => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender));
        if (room) {
            delete conn.game[room.id];
            return conn.reply(m.chat, theme.build([
                { type: 'title', text: '🧹 تم إنهاء اللعبة' },
                { type: 'subtitle', text: 'تم حذف الغرفة وتصفير القائمة بنجاح!' }
            ]), m);
        } else {
            return conn.reply(m.chat, '❌ ليس لديك أي لعبة قائمة لتنهيها.', m);
        }
    }

    // التحقق إذا كان المستخدم بالفعل في لعبة
    let currentRoom = Object.values(conn.game).find(room => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender));
    if (currentRoom) {
        return conn.reply(m.chat, theme.build([
            { type: 'title', text: '⚠️ تـنـبـيـه' },
            { type: 'subtitle', text: 'أنت بالفعل في لعبة قائمة حالياً!' },
            { type: 'divider' },
            { type: 'line', text: `⚔️ للخروج اكتب: *${usedPrefix}${command} خروج*` }
        ]), m);
    }

    // البحث عن غرفة في انتظار خصم
    let room = Object.values(conn.game).find(room => room.state === 'WAITING');

    if (room) {
        // انضمام لاعب ثاني
        room.o = m.chat;
        room.game.playerO = m.sender;
        room.state = 'PLAYING';
        
        let arr = room.game.render().map(v => {
            return {
                X: '❌',
                O: '⭕',
                1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
                4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
                7: '7️⃣', 8: '8️⃣', 9: '9️⃣',
            }[v];
        });

        let str = theme.build([
            { type: 'title', text: '🎮 لـعـبـة إكـس أو ❌⭕' },
            { type: 'divider' },
            { type: 'line', text: `${arr.slice(0, 3).join(' ')}` },
            { type: 'line', text: `${arr.slice(3, 6).join(' ')}` },
            { type: 'line', text: `${arr.slice(6).join(' ')}` },
            { type: 'divider' },
            { type: 'info', label: '⚔️ دور', value: '@' + room.game.currentTurn.split('@')[0] },
            { type: 'line', text: '📌 اكتب رقم المربع (1-9) للعب' }
        ]);

        await conn.sendMessage(room.x, { text: str, mentions: [room.game.currentTurn] }, { quoted: m });
        if (room.x !== room.o) await conn.sendMessage(room.o, { text: str, mentions: [room.game.currentTurn] }, { quoted: m });

    } else {
        // إنشاء غرفة جديدة
        room = {
            id: 'tictactoe-' + (+new Date),
            x: m.chat,
            o: '',
            game: new TicTacToe(m.sender, 'o'),
            state: 'WAITING'
        };
        
        await conn.reply(m.chat, theme.build([
            { type: 'title', text: '🔍 بـحـث عـن خـصـم' },
            { type: 'subtitle', text: 'في انتظار شريك للعب...' },
            { type: 'divider' },
            { type: 'info', label: '📌 للانضمام', value: `اكتب ${usedPrefix}${command}` },
            { type: 'info', label: '🚪 للإلغاء', value: `اكتب ${usedPrefix}${command} خروج` }
        ]), m);
        
        conn.game[room.id] = room;
    }
};

handler.before = async (m, { conn }) => {
    conn.game = conn.game ? conn.game : {};
    if (!m.isGroup) return false;
    
    let room = Object.values(conn.game).find(room => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender) && room.state === 'PLAYING');
    
    if (room) {
        let pos = parseInt(m.text);
        if (isNaN(pos) || pos < 1 || pos > 9) return false;
        
        let { game } = room;
        if (game.currentTurn !== m.sender) return false;
        
        if (game.turn(game.currentTurn === game.playerX ? 'X' : 'O', pos - 1)) {
            let arr = game.render().map(v => {
                return {
                    X: '❌',
                    O: '⭕',
                    1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
                    4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
                    7: '7️⃣', 8: '8️⃣', 9: '9️⃣',
                }[v];
            });
            
            let str = theme.build([
                { type: 'title', text: '🎮 لـعـبـة إكـس أو ❌⭕' },
                { type: 'divider' },
                { type: 'line', text: `${arr.slice(0, 3).join(' ')}` },
                { type: 'line', text: `${arr.slice(3, 6).join(' ')}` },
                { type: 'line', text: `${arr.slice(6).join(' ')}` },
                { type: 'divider' },
                { type: 'info', label: '⚔️ دور', value: '@' + game.currentTurn.split('@')[0] }
            ]);
            
            await conn.sendMessage(m.chat, { text: str, mentions: [game.currentTurn] }, { quoted: m });
            
            if (game.winner) {
                if (game.winner === 'draw') {
                    await conn.reply(m.chat, '🤝 انتهت اللعبة بالتعادل!', m);
                } else {
                    let winner = game.winner === 'X' ? game.playerX : game.playerO;
                    await conn.reply(m.chat, `🎉 الفائز هو @${winner.split('@')[0]} حصل على +500 نقطة!`, m, { mentions: [winner] });
                    
                    if (!global.db.data.users[winner]) global.db.data.users[winner] = {};
                    if (!global.db.data.users[winner].points) global.db.data.users[winner].points = 0;
                    global.db.data.users[winner].points += 500;
                }
                delete conn.game[room.id];
            }
            return true;
        }
    }
    return false;
};

handler.help = ['اكس_او', 'ttt'];
handler.tags = ['game'];
handler.command = /^(اكس_او|ttt|tic)$/i;

export default handler;