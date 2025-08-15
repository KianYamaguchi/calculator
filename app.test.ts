import request from 'supertest';
import { app } from './app';

describe("/ルートのテスト", () => {
    test("/に行ったらhelloと返ってくる", async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain("hello");
    });
});
describe("/homeルートのテスト", () => {
    test("/homeに行ったらhome.ejsがレンダリングされる", async () => {
        const res = await request(app).get('/home');
        expect(res.status).toBe(200);
        expect(res.text).toContain("<h1>計算機</h1>");
    });
});