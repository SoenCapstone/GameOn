## Containerization and Deployment Environment

This section documents how the **GameOn** platform is containerized for local development and how it will be deployed to the cloud in future iterations.  
Containerization ensures environment consistency, reproducibility, and scalability across all stages — from local testing to production.

---

## Local Development Setup

The project uses **Docker Compose** to containerize the PostgreSQL database and manage local development environments.  
This approach simplifies setup for contributors by removing manual database installation steps and providing a standardized runtime.

### Docker Compose Configuration

```yaml
services:
  db:
    image: postgres:15
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gameon_db
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

---

### **Key Points**

- **Persistent Data Volume** — The `db_data` volume keeps PostgreSQL data persistent across container restarts or rebuilds.  
- **Port Mapping** — The database is exposed on port `5432`, allowing backend microservices to connect seamlessly.  
- **Environment Variables** — Credentials and settings are injected securely through environment variables rather than hard-coding values.  
- **Service Isolation** — Each Spring Boot service connects to this shared containerized database, enabling local integration tests while maintaining independence.  
- **Quick Setup** — Developers can spin up the local DB instantly with:  
  ```bash
  docker-compose up -d

---

## Reference

- [Docker Documentation](https://docs.docker.com/get-started/)  
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)  
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)  

---

