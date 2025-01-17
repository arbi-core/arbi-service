import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Bot } from "./Bot.entity";

@Entity("bot_history")
export class BotHistory {
  @PrimaryGeneratedColumn("uuid")
  history_id: string;

  @ManyToOne(() => Bot, (bot) => bot.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id" })
  bot: Bot;

  @Column({ type: "varchar", length: 255 })
  action: string;

  @Column({ type: "timestamptz" })
  timestamp: Date;

  @Column({ type: "text", nullable: true })
  details: string;
}
