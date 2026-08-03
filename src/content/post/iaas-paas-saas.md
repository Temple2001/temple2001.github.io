---
title: IaaS vs PaaS vs SaaS
description: IaaS, PaaS, SaaS의 개념을 정리해보자
pubDate: 2025-05-23
tags: [리서치, IaaS, PaaS, SaaS]
---

# 목차

# IaaS

- Infrastructure as a Service
- 서버, 스토리지, 네트워크 등 **IT 인프라**를 가상화하여 인터넷을 통해 제공하는 서비스 모델
- 사용자 관리 범위 : 운영체제, 미들웨어, 런타임, 애플리케이션, 데이터를 담당
- 제공업체 관리 범위 : 하드웨어, 스토리지, 네트워크 등 기초적인 인프라 제공
- Example) AWS EC2, Google Compute Engine, Azure VM

# PaaS

- Platform as a Service
- 애플리케이션 **개발, 실행 배포를 위한 플랫폼**을 제공하는 서비스 모델
- 사용자 관리 범위 : 애플리케이션과 데이터 관리에 집중
- 제공업체 관리 범위 : 인프라뿐만 아니라 운영체제, 미들웨어, 런타임 환경까지 관리
- Example) AWS Elastic Beanstalk, Heroku, Vercel

# SaaS

- Software as a Service
- 사용자가 별도 설치나 관리 없이 인터넷을 통해 **바로 사용할 수 있는 완성된 소프트웨어**를 제공하는 서비스 모델
- 사용자 관리 범위 : 소프트웨어 사용과 관련된 설정만 담당
- 제공업체 관리 범위 : 인프라, 플랫폼, 애플리케이션까지 모든 것을 관리
- Example) Google Workspace, Microsoft 365, Dropbox, Zoom

# 비유로 쉽게 이해하기

- IaaS: **빈 집(하드웨어)만 빌려주고, 내부 인테리어(운영체제, 앱 등)는 직접 꾸미는 것**
- PaaS: **기본 인테리어(운영체제, 미들웨어, 개발도구 등)가 완비된 집을 빌려서, 원하는 가구(앱)만 들여놓으면 되는 것**
- SaaS: **가구, 인테리어까지 모두 완비된 집에 입주해서 바로 생활(업무)만 하면 되는 것**