import express from 'express';
import path from 'path';
import { evaluate } from 'mathjs';

export const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('public', path.join(__dirname, 'public'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send("hello");
});

app.get('/home', (req, res) => {
    res.render('home', { number: undefined, error: undefined });
});

app.post('/calculate', (req, res) => {
    const expression = req.body.expression;
    let number;
    let error;
    try {
        number = evaluate(expression);
    } catch (e) {
        console.error(e);
        error = "無効な計算式です";
    }
    res.render('home', { number, error });
});

app.listen(3000, () => {
    console.log("ポート3000で受付");
});