import os
from pathlib import Path

from openai import OpenAI
from dotenv import load_dotenv
from flask import Flask, url_for, render_template, request, Response

# Credit : https://github.com/DocstringFr/FlaskGPT

# OPENAI API KEY###################################################
dotenv_path = Path(__file__).parent / ".openai_api_key"
load_dotenv(dotenv_path=dotenv_path)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
# dont forget to add credit : https://platform.openai.com/account/billing/overview
###################################################


# API call ###################################################
# princing : https://openai.com/pricing
# https://github.com/openai/openai-python
# https://platform.openai.com/docs/overview


def build_conversation_dict(messages: list[str]) -> list[dict]:
    return [
        {
            "role": "user" if i % 2 == 0 else "assistant",
            "content": message,
        }
        for i, message in enumerate(messages)
    ]


def event_stream(conversation: list[dict]):
    stream_responce = client.chat.completions.create(
        model="gpt-3.5-turbo-1106", messages=conversation, stream=True
    )

    # return completion.choices[0].message # No streaming
    for chunk in stream_responce:
        text = chunk.choices[0].delta.content or ""
        if text != "":
            yield text


###################################################


# ROUTE : ###################################################
app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/prompt", methods=["POST"])
def prompt():
    messages = request.json["messages"]
    conversation = build_conversation_dict(messages)
    return Response(event_stream(conversation), mimetype="text/event-stream")


###################################################


if __name__ == "__main__":
    app.run(debug=True, port=5000)
