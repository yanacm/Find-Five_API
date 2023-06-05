import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Estatisticas from "./models/Estatisticas.js";
import Tentativa from "./models/Tentativa.js";
import jwt from "jsonwebtoken";

dotenv.config();

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

const app = express();
app.use(express.json());
app.use(cors({
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.get('/', (req, res) => {
    return res.status(200).json({msg: "Deu certo!"})
})

app.listen(3000);

app.get('/estatisticas', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const estatisticas = await Estatisticas.findOne({id_usuario: payload._id})

        const vitorias = Math.round((estatisticas.total_vitorias/estatisticas.total_partidas) * 100)

        const statistic = {
            jogos:estatisticas.total_partidas,
            qtd_vitorias:estatisticas.total_vitorias,
            vitorias:vitorias || 0,
            seq_vitorias:estatisticas.seq_atual_vitorias,
            melhor_seq:estatisticas.melhor_seq
        } 

        return res.status(200).json({msg:"Estatística encontrada com sucesso!", data:statistic})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.post('/estatisticas', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const estatisticasCheck = await Estatisticas.findOne({id_usuario: payload._id})  
        const id = payload._id
        
        if(estatisticasCheck){
            return res.status(402).json({msg: "Esse usuário já tem uma estatística!"})
        }

        try {
            const estatisticas = new Estatisticas({
                id_usuario: id,
                total_partidas: 0,
                total_vitorias: 0,
                seq_atual_vitorias: 0,
                melhor_seq: 0
            })

            try {
                await estatisticas.save()
                return res.status(200).json({msg: "Estatística criada!"})  
            }
            catch (erro){
                return res.status(400).json({msg: erro})
            }
        } catch (error) {
            return res.status(400).json({msg: error})
        }

    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.put('/estatisticas/ganhar', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const estatisticas = await Estatisticas.findOne({id_usuario: payload._id})

        const {total_partidas,total_vitorias,seq_atual_vitorias} = estatisticas 

        estatisticas.total_partidas = total_partidas + 1;

        estatisticas.total_vitorias = total_vitorias + 1;

        estatisticas.seq_atual_vitorias = seq_atual_vitorias + 1;

        if(estatisticas.melhor_seq < estatisticas.seq_atual_vitorias){
            estatisticas.melhor_seq = estatisticas.seq_atual_vitorias;
        }

        await estatisticas.save()

        return res.status(200).json({msg:"Estatística atualizada com sucesso!"})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.put('/estatisticas/perder', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const estatisticas = await Estatisticas.findOne({id_usuario: payload._id})

        const {total_partidas} = estatisticas 

        estatisticas.total_partidas = total_partidas + 1;

        estatisticas.seq_atual_vitorias = 0;

        await estatisticas.save()

        return res.status(200).json({msg:"Estatística atualizada com sucesso!"})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.post('/tentativas', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        for(let i = 1; i <= 7; i++){
            const tentativa = await Tentativa.findOne({id_usuario: payload._id, num: i})
            if(tentativa){
                return res.status(402).json({msg: `Esse usuário já tem tentativa para o número ${i}`})
            }
        }

        for(let i = 1; i <= 7; i++){
            const tentativa = new Tentativa({
                id_usuario: payload._id,
                num: i,
                qtd_tentativa: 0
            })
            await tentativa.save()
        }
        return res.status(200).json({msg:"Tentativas criadas com sucesso!"})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.get('/tentativas', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const tentativas = await Tentativa.find({id_usuario: payload._id})

        if(!tentativas){
            return res.status(402).json({msg: "Esse usuário não tem tentativas!"})
        }

        let qtd_total = 0;

        tentativas.forEach(tentativa => {
            qtd_total += tentativa.qtd_tentativa
        })

        const res_tentativas = []
        
        tentativas.forEach(tentativa => {
            let taxa = Math.round((tentativa.qtd_tentativa / qtd_total) * 100)
            res_tentativas.push({num: tentativa.num, qtd: tentativa.qtd_tentativa, taxa: taxa || 0})
        })

        return res.status(200).json({msg:"Estatística encontrada com sucesso!", data: res_tentativas})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.put('/tentativas/:num', async(req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.status(401).json({msg: "Acesso Negado!"});

    const {num} = req.params

    try {
        const secret = process.env.SECRET;

        const payload = jwt.verify(token, secret);

        const tentativa = await Tentativa.findOne({id_usuario: payload._id, num: num})

        if(!tentativa){
            return res.status(402).json({msg: `Esse usuário não tem tentativa para o número ${num}!`})
        }

        tentativa.qtd_tentativa = tentativa.qtd_tentativa + 1;

        await tentativa.save()

        return res.status(200).json({msg:`Tentativa atualizada com sucesso para o número ${num}!`})
    }
    catch (erro){
        return res.status(400).json({msg: "Token inválido!"})
    }
})

app.delete('/tentativas/:id', async(req,res) => {
    const {id} = req.params

    try {
        const tentativa = await Tentativa.findByIdAndRemove(id)

        return res.status(200).json({msg:`Tentativa atualizada com sucesso para o Id ${id}!`})
    }
    catch (erro){
        return res.status(400).json({msg: "Algo deu errado!"})
    }
})

mongoose.connect(
    `mongodb+srv://${dbUser}:${dbPass}@cluster0.whxr4yj.mongodb.net/?retryWrites=true&w=majority`
)
.then(() => {
    console.log("Servidor Iniciado e Conectado ao Banco")
}).catch((error) => console.log(error))
