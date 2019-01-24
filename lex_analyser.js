//Загрузка содержимого веб-страницы
window.onload = start;

function start()
{
    //Запуск функции обработки лексем, в которой осуществляется поиск в документе с помощью querySelector и обработка JSON-файла
    console.log(lexer(document.querySelector('code.language-js'), "lex_table.json"));
}

function getDataFromServer(url, parseJSON = true) 
{
    //Конструктор для загрузки данных с помощью XMLHttpRequest
    var xhr = new XMLHttpRequest();
    //Настройка запроса
    xhr.open("GET", url, false);
    //Отправка данных
    xhr.send();
    //Если статус сервера равен 200, то переходим к блоку проверки флага parseJSON
    if (xhr.status === 200) 
    {
        if (parseJSON)
        {
            //Блок исключений
            try 
            {
                //Парсим JSON-файл
                return (JSON.parse(xhr.responseText, 
                    function (keyword, val)
                    {
                        //Если ключ совпадает с идентификатором регулярного выражения
                        if (keyword === "regexp")
                                return new RegExp(val);
                        else
                            return val;
                    }
                ));
            } 
            catch (error) 
            {
                //Ошика парсинга JSON-файла
                console.error('Ошибка при попытке распарсить JSON-файл: ', error);
            }
        }
        else
        {
            //Считывание ответа сервера
            return (xhr.responseText);
        }
    }
    else 
    {
        //Ошибка запроса
        console.error('Ошибка при запросе к серверу: ', xhr.status);
    }
}

function lexer(elementWithCode, configURL) {
    //textContent содержит только текст внутри элемента, за вычетом всех 
    var cdText = elementWithCode.textContent;
    var cnfg = getDataFromServer(configURL);
    //Массив токенов
    var tknList = [];
    //Массив констант
    var arrayOfConst = [];
    //Массив идентификаторов
    var arrayOfIdent = [];
    var cnstIndex = 0;
    var IDIndex = 0;
    var cntStr = 0;
    var match;

    recLexer(cdText, cnfg, tknList, arrayOfConst, arrayOfIdent, cnstIndex, IDIndex, cntStr, match);
    return [tknList, arrayOfIdent, arrayOfConst];
}

function recLexer(cdText, cnfg, tknList, arrayOfConst, arrayOfIdent, cnstIndex, IDIndex, cntStr, match) 
{
    for (const keyword in cnfg) 
    {
        match = cdText.match(cnfg[keyword].regexp);
            
        if (match)
        {
            match = match[1];

                // Если слово совпало с регуляркой, то обрабатываем
                // Если дошли до ключа error, то, значит, слова нет в словаре
                if (keyword === "error")
                    return 'Ошибка! Неизвестное слово: '+ match;// кинуть ошибку
                // Проверяем, чтобы слово находилось в списке нужных слов, либо чтобы этого списка не было
                var FoundIsInList = (!(cnfg[keyword].list)) || ((cnfg[keyword].list) && (cnfg[keyword].list).includes(match));
                if (!FoundIsInList)
                {
                    // Нет в списке нужных слов, пропускаем
                    continue;
                }
                else
                {
                    cdText = cdText.replace(cnfg[keyword].regexp, "");

                    // Если установлен флаг skip, то не добавляем в массив
                    if (!(cnfg[keyword].skip == true))
                    {
                        // Если есть link, добавляем слово туда
                        if (cnfg[keyword].link)
                        {
                            // Добавить match в массив идентификаторов
                            // Добавить в массив лексем указатель на match в массиве идентификаторов или констант
                            if (cnfg[keyword].link == "arrayOfIdent")
                            {
                                if (arrayOfIdent.includes(match))
                                { // Если слово уже есть в массиве, добавляем ссылку на него
                                    match = [keyword, arrayOfIdent[arrayOfIdent.indexOf(match)]]
                                }
                                else
                                { // Иначе добавляем его в массив и добавляем ссылку на него
                                    arrayOfIdent.push(match);
                                    match = [keyword, arrayOfIdent[IDIndex]]
                                    IDIndex++;
                                }
                            }
                            //Добавить match в массив констант
                            if (cnfg[keyword].link == "arrayOfConst")
                            {
                                if (arrayOfConst.includes(match))
                                {
                                    match = [keyword, arrayOfConst[arrayOfConst.indexOf(match)]]
                                }
                                else
                                {
                                    arrayOfConst.push(match)
                                    match = [keyword, arrayOfConst[cnstIndex]]
                                    cnstIndex++;
                                }
                            }
                            
                        }
                        // Добавить элемент в массив
                        tknList.push(match);
                        break;
                    }
                }
            
        }
    }

    //вызов рекурсии
    if (cdText) {
        recLexer(cdText, cnfg, tknList, arrayOfConst, arrayOfIdent, cnstIndex, IDIndex, cntStr, match);
    }

}    