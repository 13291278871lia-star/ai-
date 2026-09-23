#!/bin/zsh
cd "${0:A:h}" || exit 1
url="http://127.0.0.1:4175"
mkdir -p logs
if ! /usr/bin/curl --fail --silent --max-time 2 "$url" >/dev/null; then
  python_cmd="$(command -v python3)"
  if [[ -z "$python_cmd" ]]; then
    print "找不到 Python 3，請先安裝 Python 3。"
    read -r "reply?按 Enter 關閉"
    exit 1
  fi
  PORT=4175 /usr/bin/nohup "$python_cmd" -u serve.py >>logs/server.log 2>&1 </dev/null &
fi
for attempt in {1..25}; do
  if /usr/bin/curl --fail --silent --max-time 1 "$url" >/dev/null; then
    open "$url"
    exit 0
  fi
  sleep 0.2
done
print "工作台未能啟動，請查看 logs/server.log。"
read -r "reply?按 Enter 關閉"
