import { Request, Response } from "express";

import db from "../database/connection";
import convertHourToMinutes from "../utils/convertHourMinutes";

interface ScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(req: Request, res: Response) {
    //Listagem
    const filters = req.query;

    const subject = filters.subject as string;
    const week_day = filters.week_day as string;
    const time = filters.time as string;

    if (!filters.subject || !filters.week_day || !filters.time) {
      return res.status(400).json({
        error: "Missing error",
      });
    }
    const timeInMinutes = convertHourToMinutes(time); // as string, fala que o filter.time eh uma string;

    const classes = await db("classes")
      .whereExists(function () {
        this.select("class_schedule.*")
          .from("class_schedule")
          .whereRaw("`class_schedule`.`class_id` = `classes`.`id`")
          .whereRaw("`class_schedule`. `week_day` = ??", [Number(week_day)]) //o ?? representa um parametro
          .whereRaw("`class_schedule`.`from` <= ??", [timeInMinutes])
          .whereRaw("`class_schedule`.`to` > ??", [timeInMinutes]);
      })
      .where("classes.subject", "=", subject)
      .join("users", "classes.user_id", "=", "users.id")
      .select(["classes.*", "users.*"]); //select sao todos os dados que quero trazer da tabela do banco de dados

    res.json(classes);
  }

  async create(req: Request, res: Response) {
    const { name, avatar, whatsapp, bio, subject, cost, schedule } = req.body;

    const trx = await db.transaction(); // Faz todas as operacoes do banco ao mesmo tempo, se ter erro em alguma, volta todas

    try {
      const insertedUsersIds = await trx("users").insert({
        name,
        avatar,
        whatsapp,
        bio,
      });

      const user_id = insertedUsersIds[0];

      const insertedClassesIds = await trx("classes").insert({
        subject,
        cost,
        user_id,
      });

      const class_id = insertedClassesIds[0];

      const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
        return {
          class_id,
          week_day: scheduleItem.week_day,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to),
        };
      });

      await trx("class_schedule").insert(classSchedule);

      await trx.commit(); //somento nesse momento que ele insere tudo no banco de dados
      return res.status(201).send();
    } catch (err) {
      console.log(err);
      await trx.rollback(); //Desfazer qualquer alteracao no banco durante esse meio tempo que deu erro no banco
      return res.status(400).json({
        error: "Unexpected error while creating new class",
      });
    }
  }
}
