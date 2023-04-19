import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/bands", async (req: Request, res: Response) => {
    try {

        //forma com raw
        // const result = await db.raw(`
        //     SELECT * FROM bands;
        // `)

        // forma com query builder
        //OBS: por padrao o select vazia busca tudo, mas se quiser deixar mais claro pode colocar ("*")        
        // const result = await db.select("*").from("bands") // forma mais verbosa
        
        //por padrão o  db("nome da tabela") da um select em tudo da tabela
        const result = await db("bands")// forma mais direta


        res.status(200).send(result)
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/bands", async (req: Request, res: Response) => {
    try {
        const id = req.body.id
        const name = req.body.name

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' inválido, deve ser string")
        }

        if (typeof name !== "string") {
            res.status(400)
            throw new Error("'name' inválido, deve ser string")
        }

        if (id.length < 1 || name.length < 1) {
            res.status(400)
            throw new Error("'id' e 'name' devem possuir no mínimo 1 caractere")
        }


        //forma com raw
        // await db.raw(`
        //     INSERT INTO bands (id, name)
        //     VALUES ("${id}", "${name}");
        // `)

        // podemos chamar o db.insert({}) com um objeto dentro. a chave do objeto é a coluna da tabela e o valor é o que vem no body, aprams e etc

        //forma mais verbosa:
        // await db.insert({
        //     id: id,
        //     name:name
        // }).into("bands")

        // outra forma (criar um objeto e depois inseri-lo)    
        const band ={
            id:id,
            name:name
        }

        await db("bands").insert(band)

        res.status(200).send("Banda cadastrada com sucesso")
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.put("/bands/:id", async (req: Request, res: Response) => {  
    try {
        const idToEdit = req.params.id

        const newId = req.body.id
        const newName = req.body.name

        if (newId !== undefined) {

            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }

            if (newId.length < 1) {
                res.status(400)
                throw new Error("'id' deve possuir no mínimo 1 caractere")
            }
        }

        if (newName !== undefined) {

            if (typeof newName !== "string") {
                res.status(400)
                throw new Error("'name' deve ser string")
            }

            if (newName.length < 1) {
                res.status(400)
                throw new Error("'name' deve possuir no mínimo 1 caractere")
            }
        }


        //verificando se existe o a banda no db (forma raw)
        // const [ band ] = await db.raw(`
        //     SELECT * FROM bands
        //     WHERE id = "${idToEdit}";
        // `) // desestruturamos para encontrar o primeiro item do array

        //selecione tudo da tabela bands ONDE a coluna ID seja igual ao IDtoEdit que será recebido por pamans
        const [band] = await db("bands").where({id:idToEdit})

        if (band) {
            //forma com raw
            // await db.raw(`
            //     UPDATE bands
            //     SET
            //         id = "${newId || band.id}",
            //         name = "${newName || band.name}"
            //     WHERE
            //         id = "${idToEdit}";
            // `)

            //resumo db("bands") vai seleceionar a tabela bands e fazer updadte({passo os campos e valores a serem editaods}).onde sera editado?({onde o id da tabela corresponder ao idtoedit que eu recebi por params})
            await db("bands").update({
                //curto circuito - a coluna id vai receber: newname, se não existir new name ele olha pro segundo valor e coloca ele, se existir ele faz o curto circuito e interrompe o resto do codigo
                id: newId || band.id,
                name: newName || band.name
            }).where({id:idToEdit})
        } else {
            res.status(404)
            throw new Error("'id' não encontrada")
        }

        res.status(200).send({ message: "Atualização realizada com sucesso" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/bands/:id", async (req: Request, res: Response) => {  
    try {
        const idToDelete = req.params.id

        const [band] = await db("bands").where({id:idToDelete})
        // primeiro verifica se a banda existe
        //como existe uma foreign key referenciando a tabela bands,pór causa do pragma primeiro temos que deletar da tabela songs as musicas da banda (são os itens que fazem referencia a id da banda) e depois a banda
        //depois mais um await agora sim para deletar a banda, pois as musicas que a referenciavam ja foram deletadas
        if(band){
            await db("songs").delete().where({band_id: idToDelete})
            await db("bands").del().where({id: idToDelete})// pode abreviar o delete para del

        }else{
            res.status(404)
            throw new Error("banda não encontrada")
        }

        

        res.status(200).send({ message: "banda deletada com sucesso" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/songs", async (req: Request, res: Response) => {
    try {
        const id = req.body.id
        const name = req.body.name
        const bandId = req.body.bandId

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' inválido, deve ser string")
        }

        if (typeof name !== "string") {
            res.status(400)
            throw new Error("'name' inválido, deve ser string")
        }

        if (typeof bandId !== "string") {
            res.status(400)
            throw new Error("'bandId' inválido, deve ser string")
        }

        if (id.length < 1 || name.length < 1 || bandId.length < 1) {
            res.status(400)
            throw new Error("'id', 'name' e 'bandId' devem possuir no mínimo 1 caractere")
        }

        // await db.raw(`
        //     INSERT INTO songs (id, name, band_id)
        //     VALUES ("${id}", "${name}", "${bandId}");
        // `)

        //REFATORADO COM QUERY BUILDER

       const song = {
        id: id,
        name:name,
        band_id: bandId
       }

       await db("songs").insert (song)

        res.status(200).send("Música cadastrada com sucesso")
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.put("/songs/:id", async (req: Request, res: Response) => {
    try {
        const idToEdit = req.params.id

        const newId = req.body.id
        const newName = req.body.name
        const newBandId = req.body.band_id

        if (newId !== undefined) {

            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }

            if (newId.length < 1) {
                res.status(400)
                throw new Error("'id' deve possuir no mínimo 1 caractere")
            }
        }

        if (newName !== undefined) {

            if (typeof newName !== "string") {
                res.status(400)
                throw new Error("'name' deve ser string")
            }

            if (newName.length < 1) {
                res.status(400)
                throw new Error("'name' deve possuir no mínimo 1 caractere")
            }
        }

        if (newBandId !== undefined) {

            if (typeof newBandId !== "string") {
                res.status(400)
                throw new Error("'name' deve ser string")
            }

            if (newBandId.length < 1) {
                res.status(400)
                throw new Error("'name' deve possuir no mínimo 1 caractere")
            }
        }

        // const [ song ] = await db.raw(`
        //     SELECT * FROM songs
        //     WHERE id = "${idToEdit}";
        // `) // desestruturamos para encontrar o primeiro item do array
        
        //refatorando

        const [song] = await db("songs").where({id:idToEdit})

        if (song) {
            // await db.raw(`
            //     UPDATE songs
            //     SET
            //         id = "${newId || song.id}",
            //         name = "${newName || song.name}",
            //         band_id = "${newBandId || song.band_id}"
            //     WHERE
            //         id = "${idToEdit}";
            // `)

            await db("songs").update({
                id: newId || song.id,
                name: newName || song.name,
                band_id: newBandId || song.band_id
            }).where({id:idToEdit})
        } else {
            res.status(404)
            throw new Error("'id' não encontrada")
        }

        res.status(200).send({ message: "Atualização realizada com sucesso" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/songs", async (req: Request, res: Response) => {
  try {
    //   const result = await db.raw(`
    //     SELECT
    //       songs.id AS id,
    //       songs.name AS name,
    //       bands.id AS bandId,
    //       bands.name AS bandName
    //     FROM songs
    //     INNER JOIN bands
    //     ON songs.band_id = bands.id;
    //   `)
      // referencie o notion do material assíncrono "Mais práticas com query builder"
      // (Seções "Apelidando com ALIAS" e "Junções com JOIN")
    
      // quando vamos selecionar coisas especificas das tabelas, ou os inner join, tudo tem que ser como string, inclusive o sinal de = para a referencia da foreign key, e sepradaos por virgula
      const result = await db("bands")
      .select(
        "bands.id AS Idbanda",
        "bands.name AS nomeBAnda",
        "songs.id AS musicaID",
        "songs.name AS nomeMusica",
        "songs.band_id AS idbanda"
      )
      .innerJoin(
        "songs", "songs.band_id", "=", "bands.id"
      )

      res.status(200).send(result)
  } catch (error) {
      console.log(error)

      if (req.statusCode === 200) {
          res.status(500)
      }

      if (error instanceof Error) {
          res.send(error.message)
      } else {
          res.send("Erro inesperado")
      }
  }
})