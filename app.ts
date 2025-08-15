import express from 'express';
import path from 'path';
import { evaluate } from 'mathjs';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import session from 'express-session';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydb',
    password: 'root',
    port: 5432,
});

export const app = express();

app.use(session({
    secret: 'your_secret_key', // 任意の文字列に変更
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // 開発環境ではfalseでOK
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('public', path.join(__dirname, 'public'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send("hello");
});

function requireLogin(req: any, res: any, next: any) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// 例: /home をログイン必須に
app.get('/home', requireLogin, (req, res) => {
    res.render('home', {
        session: req.session,
        number: undefined,
        error: undefined
    });
});

app.post('/calculate', requireLogin, (req, res) => {
    const expression = req.body.expression;
    let number;
    let error;
    try {
        number = evaluate(expression);
    } catch (e) {
        console.error(e);
        error = "無効な計算式です";
    }
    res.render('home', {
        session: req.session,
        number,
        error
    });
});

app.get('/register', (req, res) =>  {
    res.render("register")
})

app.get('/login', (req, res) => {
    res.render("login")
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );
        res.render('login');
    } catch (err: any) {
        if (err.code === '23505') { // UNIQUE制約違反
            return res.render('register', { error: 'このユーザー名は既に使われています' });
        }
        console.error(err);
        res.status(500).send('ユーザー登録に失敗しました');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        console.log(result.rows);
        if (result.rows.length === 0) {
            return res.render('login', { error: 'ユーザーが見つかりません' });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'パスワードが違います' });
        }
        // 認証成功→セッションにユーザー情報を保存
        (req.session as any).user = { id: user.id, username: user.username };
        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.status(500).send('ログインに失敗しました');
    }
});

// ログアウト処理
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.listen(3000, () => {
    console.log("ポート3000で受付");
});