---
title: certbot 설치 없이 인증서 만료일 확인 및 갱신
description: docker를 사용하여 certbot 설치 없이 간편하게 HTTPS 인증서를 자동으로 갱신해보자
pubDate: 2025-05-19
tags: [인프라, Certbot, Docker, crontab, HTTPS, 인증서]
---

이전에 certbot 설치 없이 인증서를 발급하는 docker 명령어를 사용한 적이 있었는데, 이번에는 자동갱신을 certbot 설치 없이 docker 명령어로 수행할 예정이다.

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

이전에 사용했던 인증서 발급 명령어는 위와 같다.

```bash
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certificates
```

발급한 인증서의 만료일을 확인하고 싶다면 위와 같은 명령어로 확인 가능하다.

```bash
docker run --rm \
  -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot renew --standalone
```

발급한 인증서를 갱신하고 싶다면 위와 같은 명령어로 확인 가능하다.

---

다만 주의해야 할 점이 있는데, 해당 서버의 80포트가 열려 있어야 하고 80포트를 점유하고 있는 프로세스가 있어서는 안된다는 것이다.

해당 명령어에서 인증서 갱신에 사용하는 방법인 **HTTP-01 챌린지** 방식에서는 접속 가능한 80포트 없이 갱신할 수 없다.

이때 나는 nginx 설정으로 80→443 자동 리다이렉션을 구성하고 있는 상태였는데, 인증서 자동 갱신을 위해 해당 설정을 비활성화 해야했다.

---

```bash
0 0 * * * docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt -v /var/lib/letsencrypt:/var/lib/letsencrypt certbot/certbot renew --standalone >> /home/ec2-user/directory/certbot-renew.log 2>&1
```

`crontab -e` 로 열리는 파일에 위의 명령어를 붙여넣으면 crontab이 매일 00시마다 인증서 갱신을 시도하고 `directory/certbot-renew.log`에 로그를 작성한다.

certbot 특성상 인증서 만료일이 임박하지 않으면 “Certificate not yet due for renewal” 메시지를 띄우며 인증서 갱신을 하지 않으므로 매일 만료일이 갱신되는 건 아니다.

그러나 매일 갱신을 시도하므로 인증서가 만료될 일은 없을 것이다.