-- AlterTable: token_hash passa a ser único (busca de refresh token por hash usa findUnique)
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
