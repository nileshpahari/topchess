-- CreateEnum
CREATE TYPE "GameEndReason" AS ENUM ('CHECKMATE', 'STALEMATE', 'DRAW', 'TIMEOUT', 'RESIGNATION', 'ABANDONED');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "endReason" "GameEndReason";
