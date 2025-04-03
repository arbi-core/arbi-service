import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("bots")
export class Bot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  type: string;

  @Column({
    type: "enum",
    enum: ["active", "stopped", "paused"],
    default: "stopped",
  })
  status: "active" | "stopped" | "paused";

  @Column({ type: "jsonb" })
  config: object;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
