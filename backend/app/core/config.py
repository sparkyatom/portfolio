from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./portfolio.db"
    cors_origins: str = "http://localhost:5173"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_timeout: int = 15
    contact_to: str = "sandeepanpodder2002612@gmail.com"
    rate_limit_per_hour: int = 5
    show_phone: bool = True
    trust_proxy: bool = False       # true only behind a proxy you control (uses X-Forwarded-For)
    reseed_on_start: bool = False   # true = overwrite DB content from seed.json at startup
    @field_validator("database_url")
    @classmethod
    def _driver(cls, v: str) -> str:  # hosts often give postgres:// or postgresql://
        for old in ("postgres://", "postgresql://"):
            if v.startswith(old): return "postgresql+psycopg://" + v[len(old):]
        return v
settings = Settings()
