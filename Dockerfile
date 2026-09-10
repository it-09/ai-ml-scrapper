FROM apify/actor-node:22 AS builder

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --include=dev

COPY src/ ./src/
COPY tsconfig.json ./

RUN npm run build

FROM apify/actor-node:22

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist/

CMD ["npm", "start"]
