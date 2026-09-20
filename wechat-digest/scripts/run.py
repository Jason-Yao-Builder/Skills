#!/usr/bin/env python3
import os
from pathlib import Path
import sys


def main():
    configured = os.environ.get("WECHAT_DIGEST_RUNTIME", "").strip()
    if not configured:
        print("未配置执行器：设置 WECHAT_DIGEST_RUNTIME 为外部 digest.py 的绝对路径。本 Skill 不包含该执行器。", file=sys.stderr)
        return 2
    runtime = Path(configured).expanduser()
    if not runtime.is_absolute() or not runtime.is_file() or runtime.suffix != ".py":
        print("WECHAT_DIGEST_RUNTIME 必须指向存在的 Python 文件绝对路径。", file=sys.stderr)
        return 2
    if runtime.resolve() == Path(__file__).resolve():
        print("执行器不能指向本入口脚本。", file=sys.stderr)
        return 2
    os.execv(sys.executable, [sys.executable, str(runtime), *sys.argv[1:]])


if __name__ == "__main__":
    raise SystemExit(main())
