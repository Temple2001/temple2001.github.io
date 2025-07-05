---
title: 원생 관리 프로그램 제작기
description: Python 기반으로 학원생을 관리하는 자동화 프로그램을 제작하였습니다.
pubDate: 2023-01-28
tags: ['tmp']
---

# 목차

# 제작 동기

아버지는 현재 학원에서 회계 및 학원생 정보 관리를 맡고 계신다.

최근 아버지가 학원에 있는 수많은 학생들의 정보를 관리하는 것에 있어서 많은 피로감을 느끼시는 것을 보고, 요즘 공부하고 있는 자동화를 사용하면 부담을 좀 덜어드릴 수 있지 않을까 생각하여 아버지의 업무에 알맞은 자동화된 원생 관리 프로그램을 만들자고 계획하게 되었다.

# 준비 과정

아무리 학원 업무가 수작업이 많다 하더라도 기본적인 학원 원생 관리 프로그램은 보유하고 있기 때문에 학원생들의 정보가 종류별로 정렬된 데이터를 찾을 수 있었다(excel).

나의 목표는 이런 데이터를 바탕으로 특정 원생을 검색했을 때 그 원생에 해당하는 모든 종류의 데이터들을 한눈에 볼 수 있도록 보여주는 프로그램을 만드는 것이다.

---

기존 학원 원생 관리 프로그램에서 제공하는 데이터의 종류는 다음과 같다.

- 원생의 학년, 전화번호, 소속된 반, 담당선생님 등의 정보들이 적힌 **개인정보** 데이터
- 각 주차마다 원생들의 '학원' 시험 점수가 월별로 나뉘어져 적힌 **학원시험점수** 데이터
- 원생들의 '학교' 시험 점수가 시험별로 나뉘어져 적힌 **학교시험점수** 데이터
- 월 별 각 학생의 상담 날짜와 상담 내용이 적힌 **학생상담** 데이터

나뉘어진 데이터들은 한 엑셀 파일에 다른 시트들로 분리되어 있다.

---

하지만 가공할 데이터들을 놓고 보니 **개인정보** 데이터를 제외한 나머지 데이터들은 하나의 시트에 모아져 있지 않았고, 시간이 지나면 다음 달이나 다음 시험에 해당하는 데이터들이 추가되어 시트는 앞으로 계속 늘어갈 예정이었다.

따라서 나는 앞으로 어떤 종류의 데이터가 들어오든 프로그램이 모두 읽어들여 보여줄 수 있도록 설계해야 했다.

최종적으로 내가 계획한 프로그램의 모습은 프로그램이 사용자에게 검색할 대상의 이름을 받고, 기본 학원 원생 관리 프로그램에서 export한 원본데이터인 **data.xlsx**를 프로그램이 읽어온 후, 내부적으로 사용자에게 받은 대상의 이름으로 데이터를 검색하여 대상과 일치하는 데이터들을 찾은 다음, 산출결과인 **result.xlsx**에 보기 편하도록 작성하는 것이다.

그리고 사용자가 result.xlsx를 엑셀 프로그램으로 직접 실행하는 대신 그 데이터를 html로 가공하고 Flask를 이용한 웹서버로 띄워주도록 한다. 결국 사용자는 프로그램을 실행하기만 한다면 정리정돈된 원생 데이터를 웹브라우저로 편리하게 확인할 수 있게 되는 것이다.

# 코드 설명

## 데이터 불러오기

```python
data_path = 'data.xlsx'

# 데이터 불러오기
dataframe = pd.read_excel(data_path, sheet_name=None)
sheet_names = list(dataframe.keys())
```

먼저 pandas의 `read_excel()` 함수를 이용해 원본 데이터인 `data.xlsx` 를 읽어온다.

## 데이터를 기반으로 엑셀에 기입하기

```python
def excel_print(ws, index, target_name):

    global location
    color = color_alloc()
    data = dataframe[sheet_names[index]]

    ws.append([])
    ws.append([])
    location += 2

    ws.merge_cells(start_row=location, start_column=1, end_row=location, end_column=data.shape[1])

    point = ws.cell(location, 1)
    point.value = sheet_names[index]
    point.alignment = Alignment('center', 'center')
    point.fill = PatternFill(fgColor=color, fill_type='solid')
    point.font = Font(size=22, bold=True)
    for i in range(data.shape[1]):
        ws.cell(location, i + 1).border = Border(bottom=Side(border_style='thin', color='000000'))
    location += 1

    ......
```

`excel_print()` 함수는 openpyxl의 Workbook 객체인 `ws`, 엑셀에 작성할 원생 데이터의 순서인 `index`, 목표 원생의 이름인 `target_name` 을 매개변수로 받는다.

---

```python
......

    # 검색할 이름과 일치하는 데이터 검색 (맨 앞 열에 이름이 들어있다고 가정)
    lines = data[data.iloc[:, 0] == target_name].values.tolist()

......
```

그리고 `data.xlsx` 에서 읽어온 데이터를 기반으로 `target_name` 에 해당하는 원생의 데이터를 변수에 저장한다.

---

```python
......

    # 검색된 데이터가 없으면 스킵
    if not lines:
        ws.merge_cells(start_row=location, start_column=1, end_row=location, end_column=data.shape[1])
        ws.cell(location, 1).value = '데이터 없음'
        ws.cell(location, 1).alignment = Alignment('center', 'center')
        ws.cell(location, 1).font = Font(size=15, bold=True)
        location += 1
        return


    # 데이터 열 이름 작성
    ws.append(data.columns.tolist())
    for i in range(data.shape[1]):
        ws.cell(location, i + 1).alignment = Alignment('center', 'center')
        ws.cell(location, i + 1).fill = PatternFill(fgColor='C8C8C8', fill_type='solid')
        ws.cell(location, i + 1).font = Font(size=15, bold=True)
    location += 1


    # 데이터 내용 테두리 설정
    box = Border(
        left=Side(border_style="thick", color=color),
        right=Side(border_style="thick", color=color),
        bottom=Side(border_style="thick", color=color)
    )


    # 데이터 내용 작성
    for line in lines:
        ws.append(line)
        for i in range(data.shape[1]):
            ws.cell(location, i + 1).alignment = Alignment('center', 'center', wrap_text=True)
            ws.cell(location, i + 1).font = Font(size=15)
            ws.cell(location, i + 1).border = box
        location += 1
```

만약 검색된 데이터가 없다면 데이터가 없다는 내용을 엑셀에 작성하고, 있다면 데이터에 알맞은 열 이름과 색상 및 테두리와 함께 데이터 내용을 엑셀에 작성한다.

## 검색 결과를 바탕으로 웹 페이지 구성

### 메인 페이지

```python
# 메인 페이지
@app.route('/')
def index():
    return render_template('index.html', version_name=version_name)
```

```html
{% extends "base.html"%}
{% block content %}

<div class="jumbotron">
    <h1>원생 프로그램 ver {{version_name}}&nbsp;&nbsp;<span style="font-size: 50%;">by Temple</span></h2>
        <br>
        <h5>원생 이름을 입력한 후, 검색 버튼을 눌러 원생 정보를 조회하세요.</h4>
            <br>
            <br>
            <h5>&nbsp;&nbsp;&nbsp;[유의사항]</h5>
            <p></p>
            <ul>
                <li>data.xlsx : 모든 학생의 여러 데이터들이 들어있는 데이터베이스</li>

                <li>result.xlsx : 검색한 학생의 데이터만 기록되어있는 결과물</li>

                <li>data.xlsx에 저장되는 각 시트들은 모두 첫번째 열이 이름에 해당하는 칸이어야 합니다.</li>
            </ul>
            <br>
            <br>

            <form action="{{url_for('result')}}">
                <label for="first"><b>원생 이름 :</b>&nbsp;</label>
                <input type="text" name="user_name">

                &nbsp;
                <input class="btn btn-primary" type="submit" value="검색">
            </form>
</div>

{% endblock %}
```

먼저 프로그램에 대한 설명과 검색할 원생의 이름을 입력하는 칸이 있는 메인 페이지를 구성했다.

### 결과 페이지

```python
# 결과 페이지
@app.route('/result')
def result():
    global location

    name = request.args.get('user_name')

    try:
        # result.xlsx 기존 내용 삭제하고 새로운 형식 만들기
        wb = op.load_workbook('result.xlsx')
        ws_remove = wb.active
        ws_remove.title = 'remove'

        ws = wb.create_sheet()
        ws.title = '요약'

        wb.remove(wb['remove'])

......
```

다음으로 메인 페이지에서 원생의 이름을 입력하고 검색 버튼을 누르면 이동하는 결과 페이지를 구성했다.

결과 페이지를 불러오기 전, 기존 `result.xlsx` 에 저장된 이전 검색 결과를 삭제하고 새 sheet로 덮어씌워 새 검색 결과를 저장할 수 있도록 했다.

---

```python
......

        # 제목 설정
        main_box = Border(
            left=Side(border_style='double', color='000000'),
            right=Side(border_style='double', color='000000'),
            top=Side(border_style='double', color='000000'),
            bottom=Side(border_style='double', color='000000'))
        ws.merge_cells('A1:H1')
        ws['A1'].value = f'{name} 학생 현황 자료'
        ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
        ws['A1'].font = Font(size=30, bold=True)
        for i in range(8):
            ws.cell(1, i + 1).border = main_box
        location = 2    # 현재 작성하는 셀의 위치


        # 엑셀 작성
        for index in range(len(sheet_names)):
            excel_print(ws, index, name)


        # 엑셀 칸 적절하게 맞추기
        for i, column_cells in enumerate(ws.columns):
            length = max(len(str(cell.value)) for cell in column_cells)
            if length > 20 : length = 20
            ws.column_dimensions[get_column_letter(i + 1)].width = length + 3


        wb.save('result.xlsx')
        xlsx2html('result.xlsx', 'templates/result.html')
        return render_template('result.html')
    
    except Exception as e:
        return render_template('error.html', error_msg=e)

......
```

그리고 제목, 스타일 등을 설정해주고 `excel_print()` 함수를 사용해 전달받은 원생 이름의 검색 결과를 엑셀에 작성한다.

한 셀에 너무 긴 텍스트가 들어갔을 때 셀 크기를 조절하는 작업도 수행해준다.

# 후기

지금껏 내가 만들었던 파이썬 프로그램들은 전부 터미널에서 입출력하는 방식이었다. 이렇게 직접 html을 작성하고 웹서버를 열어보니 색다른 경험이 된 것 같다. 

다만 페이지를 구성할 때 css에 대한 지식이 전무해서 부트스트랩의 도움을 받아 스타일링했는데, 덕분에 편하게 페이지를 만들 수 있었지만 더 높은 자유도로 구성할 수 없었다는 점이 아쉬웠다. 웹에 대한 지식을 더 넓혀야겠다는 생각이 들었다.