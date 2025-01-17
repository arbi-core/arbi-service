import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Bot } from "./Bot.entity";

@Entity("metrics")
export class Metrics {
  @PrimaryGeneratedColumn("uuid")
  metrics_id: string;

  @ManyToOne(() => Bot, (bot) => bot.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id" })
  bot: Bot;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  profit: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  gas_cost: number;

  @Column({ type: "int", default: 0 })
  transactions: number;

  @Column({ type: "timestamptz" })
  timestamp: Date;
}
