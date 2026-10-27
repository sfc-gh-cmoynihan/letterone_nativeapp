"""Pre-warm LETTERONE_DB.PUBLIC.AGENT_RESPONSE_CACHE with answers to every sample question
in app/components/AgentPanel.tsx. Formatting mirrors app/app/api/ande-agent/route.ts.

Usage: python3 data/prewarm_agent_cache.py [agent_key ...]
"""
import json, re, sys, pathlib
from concurrent.futures import ThreadPoolExecutor
import snowflake.connector

AGENTS = {
    "treasury-ops": "LETTERONE_DB.PUBLIC.TREASURY_OPS_AGENT",
    "risk": "LETTERONE_DB.PUBLIC.RISK_AGENT",
    "structured-credit": "LETTERONE_DB.PUBLIC.STRUCTURED_CREDIT_AGENT",
    "direct-lending": "LETTERONE_DB.PUBLIC.DIRECT_LENDING_AGENT",
    "finance": "LETTERONE_DB.PUBLIC.FINANCE_AGENT",
    "cfo": "LETTERONE_DB.PUBLIC.CFO_AGENT",
    "coo": "LETTERONE_DB.PUBLIC.COO_AGENT",
}
ROOT = pathlib.Path(__file__).resolve().parents[1]


def sample_questions():
    src = (ROOT / "app/components/AgentPanel.tsx").read_text()
    block = src[src.index("const SAMPLE_QUESTIONS"):]
    block = block[: block.index("\n}\n")]
    out = {}
    for m in re.finditer(r'^\s*"?([\w-]+)"?:\s*\[(.*?)\]', block, re.S | re.M):
        out[m.group(1)] = re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(2))
    return out


def normalize(q):
    return re.sub(r"[?.!\s]+$", "", re.sub(r"\s+", " ", q.lower())).strip()


def format_answer(data):
    answer = ""
    for item in data.get("content") or []:
        if item.get("type") == "text" and item.get("text"):
            answer += item["text"] + "\n"
        elif item.get("type") == "table" and (item.get("table") or {}).get("result_set"):
            rs = item["table"]["result_set"]
            cols = [c["name"] for c in (rs.get("resultSetMetaData") or {}).get("rowType") or []]
            if cols and rs.get("data"):
                t = "| " + " | ".join(cols) + " |\n| " + " | ".join("---" for _ in cols) + " |\n"
                for row in rs["data"][:30]:
                    t += "| " + " | ".join("" if v is None else str(v) for v in row) + " |\n"
                answer += t + "\n"
    return answer.strip()


def run(agent_key, q):
    conn = snowflake.connector.connect(connection_name="aws_uswest_pat")
    try:
        cur = conn.cursor()
        body = json.dumps({"messages": [{"role": "user", "content": [{"type": "text", "text": q}]}], "stream": False})
        cur.execute(f"SELECT TRY_PARSE_JSON(SNOWFLAKE.CORTEX.DATA_AGENT_RUN(%s, %s))", (AGENTS[agent_key], body))
        raw = cur.fetchone()[0]
        data = json.loads(raw) if isinstance(raw, str) else (raw or {})
        ans = format_answer(data)
        if not ans:
            return f"EMPTY  {agent_key}: {q}"
        cur.execute("DELETE FROM LETTERONE_DB.PUBLIC.AGENT_RESPONSE_CACHE WHERE AGENT_KEY=%s AND QUESTION_KEY=%s", (agent_key, normalize(q)))
        cur.execute("INSERT INTO LETTERONE_DB.PUBLIC.AGENT_RESPONSE_CACHE (AGENT_KEY, QUESTION_KEY, QUESTION, ANSWER) VALUES (%s,%s,%s,%s)",
                    (agent_key, normalize(q), q, ans))
        return f"OK     {agent_key}: {q}"
    except Exception as e:
        return f"FAIL   {agent_key}: {q} -> {str(e)[:150]}"
    finally:
        conn.close()


if __name__ == "__main__":
    qs = sample_questions()
    keys = sys.argv[1:] or [k for k in qs if k in AGENTS]
    jobs = [(k, q) for k in keys for q in qs.get(k, [])]
    print(f"{len(jobs)} questions across {len(keys)} agents")
    with ThreadPoolExecutor(max_workers=8) as ex:
        for line in ex.map(lambda j: run(*j), jobs):
            print(line, flush=True)
