FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node public ./public
COPY --chown=node:node data/sample-tenders.json ./data/sample-tenders.json
RUN mkdir -p /app/runtime && chown node:node /app/runtime
USER node
ENV HOST=0.0.0.0 PORT=8080 DATABASE_PATH=/app/runtime/bidata.sqlite
EXPOSE 8080
CMD ["node", "server.mjs"]
