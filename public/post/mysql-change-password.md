---
title: MySQL 비밀번호 제대로 변경하기
description: MySQL이 사용자가 접속한 호스트 명에 따라 계정을 구분한다는 것을 이해하고 비밀번호를 변경해보자
pubDate: 2025-06-17
tags: [개발, 트러블슈팅, MySQL, DB 계정 관리]
---

프로젝트의 개발이 끝나고 런칭이 다가와 MySQL의 단순했던 테스트용 비밀번호를 복잡한 새 비밀번호로 변경하는 작업을 수행했다.

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '새로운_비밀번호';
FLUSH PRIVILEGS;
```

MySQL의 root 계정 비밀번호를 위와 같은 명령어로 바꾸고 Spring Boot 애플리케이션에도 새 비밀번호를 반영한 뒤 재배포를 시도했는데…

비밀번호가 틀려 DB 접속에 실패했다는 결과를 맞이하게 되었다.

무엇이 잘못되었는지 감이 잡히지 않아서 DB와 애플리케이션을 각각 여러번 재실행 해보기도 했는데 문제는 그대로였다.

여러 시행착오 끝에 찾아낸 원인은 바로 `'root'@'localhost'` 부분이었다.

---

Spring Boot 애플리케이션의 에러 로그를 보면 다음과 같은 로그가 있었다.

```bash
org.hibernate.exception.GenericJDBCException:
unable to obtain isolated JDBC connection
[Access denied for user 'root'@'192.168.96.3' (using password: YES)]
```

`'root'@'192.168.96.3'` 이라는 유저 계정으로 접속을 시도했다가 거부당했다는 것인데, 내가 비밀번호를 바꾸었던 계정은 바로 `'root'@'localhost'` 이었다. 두 계정이 다른 것이다.

MySQL에서는 **사용자의 접속 지점(호스트 명 or IP 주소)** 도 계정의 일부가 된다.

내가 서버에서 배포를 수행할 때 docker-compose로 DB와 Spring Boot 애플리케이션을 동시에 띄웠는데, 이때 docker-compose 자체의 네트워크 환경으로 인해 각 서비스는 고유한 IP 주소를 사용한다.

따라서 같은 서버에 있더라도 Spring Boot 애플리케이션이 DB에 접근할 때는 localhost가 아니라 특정 IP로 접근하게 되는 것이다.

따라서 변경된 비밀번호를 제대로 적용하기 위해서는 localhost 호스트가 아니라 **Spring Boot 애플리케이션의 호스트에 해당하는 계정**의 비밀번호를 바꾸어야 한다.

---

하지만 docker-compose로 배포를 진행할 때마다 각 서비스의 IP는 무작위로 배정되므로 특정 IP를 지정해서 비밀번호를 변경할 수는 없다.

대신 `'root'@'%'` 계정의 비밀번호를 바꾸어 모든 호스트에 해당하는 root 계정의 비밀번호를 변경할 수도 있지만, docker-compose의 기능을 이용해 `'root'@'<docker-compose 서비스 이름>'` 계정의 비밀번호를 바꾸어 Spring Boot 애플리케이션의 호스트를 가리키는 방법을 사용할 수도 있다.

이는 docker-compose의 내부 DNS로 인해 서비스 이름으로 IP를 특정할 수 있기에 가능한 것이다.

본 서버에는 Spring Boot 말고는 DB에 접근할 요소가 없기 때문에 나는 간단히 `'root'@'%'` 계정의 비밀번호를 바꾸어 문제를 해결하였다.