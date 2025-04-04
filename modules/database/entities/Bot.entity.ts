import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Define enum types
export enum Exchange {
  UNISWAP2 = "uniswap2",
  SUSHISWAP = "sushiswap",
  PANCAKE = "pancake"
}

export enum Token {
  USDT = "usdt",
  USDC = "usdc",
  ETH = "eth"
}

export enum Network {
  BNB = "bnb",
  BASE = "base",
  ARB = "arb",
  POL = "pol"
}

@Entity("bots")
export class Bot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "enum",
    enum: ["active", "stopped", "paused"],
    default: "stopped",
  })
  status: "active" | "stopped" | "paused";

  @Column({
    type: "enum",
    enum: Exchange,
    nullable: true
  })
  exchange1: Exchange;

  @Column({
    type: "enum",
    enum: Exchange,
    nullable: true
  })
  exchange2: Exchange;

  @Column({
    type: "enum",
    enum: Token,
    nullable: true
  })
  token1: Token;

  @Column({
    type: "enum",
    enum: Token,
    nullable: true
  })
  token2: Token;

  @Column({
    type: "enum",
    enum: Network,
    nullable: true
  })
  network: Network;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
