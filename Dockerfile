FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --chown=pwuser:pwuser . .
USER pwuser
EXPOSE 3000
CMD ["node", "server.js"]
