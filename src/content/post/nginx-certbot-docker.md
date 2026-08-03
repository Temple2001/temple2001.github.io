---
title: EC2에서 nginx와 certbot 설치 없이 HTTPS 적용하기
description: docker를 사용하여 nginx와 certbot 설치 없이 간편하게 HTTPS 인증서를 발급해보자
pubDate: 2025-05-08
tags: [인프라, Nginx, Certbot, Docker, HTTPS, 인증서]
---

지금까지 백엔드 서버에 HTTPS를 적용해야 했을 때는 AWS 로드밸런서를 사용하거나, 직접 nginx와 certbot을 설치하였었다.

그러나 nginx와 certbot을 설치하는 과정이 번거롭고, EC2의 경우에는 certbot을 설치하는 데 단순히 명령어 하나만으로 완료되지 않기 때문에(epel-release, snapd 필요) 불편함이 따랐다.

이에 대해 조사하던 도중 **일회용 docker 컨테이너 생성**을 이용해 빠르게 ssl 인증서를 생성하는 방법을 찾게 되었다. 

```bash
docker run -it --rm --name certbot \
  -p 80:80 \
  -v '/etc/letsencrypt:/etc/letsencrypt' \
  -v '/var/lib/letsencrypt:/var/lib/letsencrypt' \
  certbot/certbot certonly --standalone \
  -d 'mydomain.or.kr' \
  --agree-tos \
  -m 'your@email.com' \
  --no-eff-email

```

certbot 이미지를 불러와서 종료시 바로 삭제되는 일회용 컨테이너를 생성하고, 인증서 발급 결과물을 volume 설정을 통해 호스트 서버로 불러오게끔 만들어 결과적으로 해당 명령어를 실행하면 호스트 volume 위치에 인증서가 들어오게 된다. (인증을 위한 80번 포트 개방 필수)

```yaml
# docker-compose.yml
nginx:
  image: nginx:latest
  ports:
    - 80:80
    - 443:443
  volumes:
    - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt/live/example.com/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro # SSL 인증서 (수정 필요)
    - /etc/letsencrypt/live/example.com/privkey.pem:/etc/nginx/ssl/privkey.pem:ro # SSL 개인키 (수정 필요)
  depends_on:
    - nestjs
```

```bash
# ./nginx/default.conf
server {
  listen 80;
  server_name example.com www.example.com;  # 도메인 이름 (수정 필요)

  location / {
        return 301 https://$host$request_uri;
    }
}

server {
  listen 443 ssl;
  server_name example.com www.example.com;  # 도메인 이름 (수정 필요)

  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # SSL 인증서 경로 (수정 필요)
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # SSL 인증서 키 경로 (수정 필요)
  ssl_prefer_server_ciphers on;

  location / {
        proxy_pass http://nestjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

인증서를 발급받았다면 위처럼 배포에 사용할 nginx 구성을 해주면 된다.

나는 기존에 자주 사용했던 docker-compose 기반 배포로 nginx를 컨테이너화 시켰다.

# 참조

[[Docker] certbot 컨테이너를 사용해 SSL 인증서 발급받기](https://hyeo-noo.tistory.com/267)

[Certbot과 Docker로 무료 HTTPS 인증서 발급하기](https://skkuding.dev/post/certbot-docker/)