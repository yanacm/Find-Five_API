import mongoose from "mongoose"

const Estatisticas = mongoose.model("Estatisticas",{
    id_usuario: String,
    total_partidas: Number,
    total_vitorias: Number,
    seq_atual_vitorias: Number,
    melhor_seq: Number
})

export default Estatisticas;