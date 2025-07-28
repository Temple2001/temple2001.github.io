---
title: cloudflare R2에 linkding 백업하기
description: linkding 사용 중에 저장되는 북마크들을 주기적으로 Cloudflare R2에 자동 백업해보자
pubDate: 2025-07-05
tags: [인프라, 자동 백업, linkding, Cloudflare R2]
---

# linkding 이란?

![linkding-screenshot.png](linkding-screenshot.png)

[linkding 홈페이지](https://linkding.link/)

최근에 **linkding**이라는 프로그램을 자주 사용하고 있다.

linkding은 **self-hosted bookmark manager**로 서버에 설치하고 사용하며, 별도의 앱 설치 없이 웹 브라우저에서 북마크를 조회하거나 관리할 수 있다.

그리고 Docker 설치를 지원해 설치하는 과정도 매우 간편하며, 확장 프로그램이나 API를 이용해 아주 손쉽게 북마크를 추가할 수도 있다.

# linkding을 자동으로 백업해보자

linkding을 사용하면서 안전한 데이터 보존을 위해 주기적인 백업이 필요함을 느꼈다.

내가 생각한 방법은 서버에서 주기적으로 **full-backup** (linkding 자체에서 명령어를 지원함)을 수행하고 생성된 백업 zip파일을 통째로 **cloudflare R2**에 업로드하는 것이었다.

해당 zip 파일을 같은 이름으로 계속해서 업로드하면 같은 이름을 가진 이전 버전의 파일은 자동으로 덮어씌워지므로 업데이트가 이루어질 것이다.

파일을 전송하는 S3 API 중에(R2는 S3 API를 지원한다) **cp**와 **sync** 두 종류가 존재함을 알 수 있었는데, 각 차이는 다음과 같다.

- **cp** : 이름 그대로 copy. source 경로에 있는 모든 파일을 복사하므로 target 경로에 파일이 이미 존재해도 덮어씌워 버린다. 또한 source 경로에 없는 파일은 target 경로에서 삭제되지 않는다.
- **sync** : 이름 그대로 synchronization. target 경로를 확인하고 source 경로와 비교했을 때 새로 생겼거나 업데이트된 파일만 복사한다. `--delete` 옵션을 사용하면 source 경로에 없는 파일이 target 경로에서 삭제된다.

sync를 사용하면 불필요한 트래픽을 줄일 수 있지 않을까 생각해봤지만, sync에서 파일이 업데이트 되었다는 것을 판단하는 기준 중에 최종 수정일이 있기 때문에 매번 zip 파일이 업데이트되는 현재 상황에서는 별 소용이 없을 것이라고 보여졌다.

그래서 기존 계획대로 **cp 명령어**를 통해 지속적으로 백업 파일이 덮어씌워지도록 구성하게 되었다.

# 구성 과정

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

AWS CLI를 사용해야 하기 때문에 위와 같은 명령어로 설치해주었다. (unzip 설치 필요)

그리고 `aws configure` 명령어로 R2 엑세스 키 id와 시크릿 엑세스 키를 설정해주었다.

---

그리고 **systemd**를 이용해 주기적으로 linkding 백업을 진행한 다음 aws s3 cp 명령어를 실행할 수 있도록 구성해야 한다.

```bash
# linkding-backup.service

[Unit]
Description=Upload backup.zip to Cloudflare R2

[Service]
User=ubuntu  # aws configure로 설정한 자격 증명 정보를 사용하기 위해 해당 정보를 보유한 사용자를 명시적으로 지정
Type=oneshot
# linkding full-backup 진행
ExecStart=docker exec linkding python manage.py full_backup /etc/linkding/data/backup.zip
# aws s3 cp 명령어로 backup.zip 파일 업로드
ExecStart=aws s3 cp /home/ubuntu/linkding/backup.zip s3://linkding-backup/backup.zip --endpoint-url=https://<accountId>.r2.cloudflarestorage.com
```

```bash
# linkding-backup.timer

[Unit]
Description=Run linkding-backup.service every day

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

위의 .service 파일과 .timer 파일을 같은 이름(linkding-backup)으로 생성하고 `/etc/systemd/system/` 경로에 저장한다.

그렇게 되면 `linkding-backup.timer` 를 활성화했을 때 설정된 계획에 따라 `linkding-backup.service` 를 실행한다.

---

```bash
sudo systemctl daemon-reload
systemctl enable --now backup-upload.timer
```

파일 생성 후 systemctl 데몬을 새로고침하고 `linkding-backup.timer` 를 활성화해주면 최종적으로 자동 백업 스케쥴러를 구성할 수 있게 된다.

`systemctl list-timers | grep linkding-backup` 명령어로 스케쥴러가 어떤 상태인지 확인도 가능하다!

# 트러블 슈팅

- `User=ubuntu` 없이 service 코드를 실행하면 root 유저로 실행되기 때문에 ubuntu 유저에서 `aws configure` 로 설정해줬던 자격 증명 정보를 사용할 수 없다. 해당 자격 증명 정보를 설정한 유저를 명시적으로 지정해야 한다.
- systemd의 service 코드를 수정하면 `sudo systemctl daemon-reload` 를 실행해 변경 사항을 반영해주어야 한다.
- linkding 공식문서에서는 full-backup을 진행할 때 docker 명령어에서 -it 옵션을 주는데, systemd에서는 비대화환경에서 실행되므로 -it 옵션을 주고 실행할 시에 “**the input device is not a TTY(가상 터미널)”** 에러가 발생하게 된다. 따라서 -it 옵션을 빼야 한다. (그냥 백업 명령어인데 -it이 왜 필요한지는 모르겠다)
    

# 참조

[AWS S3 `sync` 명령어 원리와 사용팁](https://velog.io/@milkcoke/AWS-S3-sync-%EB%AA%85%EB%A0%B9%EC%96%B4-%EC%9B%90%EB%A6%AC%EC%99%80-%EC%82%AC%EC%9A%A9%ED%8C%81)

[aws CLI](https://developers.cloudflare.com/r2/examples/aws/aws-cli/)

[(에러)the input device is not a TTY](https://cksdid4993.tistory.com/5)

[Backups](https://linkding.link/backups/)