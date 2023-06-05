import mongoose from "mongoose"

const Tentativa = mongoose.model("Tentativa",{
    id_usuario: String,
    num: Number,
    qtd_tentativa: Number
})

export default Tentativa;