#!/usr/bin/env python3
"""
Azure Cost Management - チーム別按分請求スクリプト

Azure Cost Management API を使用してリソースグループごとの費用を取得し、
YAML定義に基づきチームへ按分した請求額を算出、CSVレポートとして出力する。

使用方法:
    python azure_billing.py <TOKEN> [--date YYYY-MM] [--cost AMOUNT]

実行例:
    python azure_billing.py eyJ0eXAi... --date 2026-03 --cost 50000
    python azure_billing.py eyJ0eXAi...
"""

import argparse
import csv
import json
import os
import sys
from calendar import monthrange
from datetime import datetime, timedelta

import requests
import yaml


# ---------------------------------------------------------------------------
# 引数解析
# ---------------------------------------------------------------------------

def parse_args():
    """コマンドライン引数を解析する。"""
    parser = argparse.ArgumentParser(
        description="Azure Cost Management - Team Billing Allocation"
    )
    parser.add_argument(
        "token",
        help="Azure API認証用のBearerトークン"
    )
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="対象月 (YYYY-MM形式、デフォルト: 先月)"
    )
    parser.add_argument(
        "--cost",
        type=float,
        default=None,
        help="チームに按分する外部共通費用"
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# 日付ユーティリティ
# ---------------------------------------------------------------------------

def get_target_date(date_str):
    """対象の年月を決定する。未指定時は先月を返す。

    引数:
        date_str: YYYY-MM形式の日付文字列、またはNone（先月を使用）。

    戻り値:
        (year, month) のタプル。
    """
    if date_str:
        try:
            dt = datetime.strptime(date_str, "%Y-%m")
            return dt.year, dt.month
        except ValueError:
            print(f"[ERROR] 日付形式が不正です: '{date_str}'。YYYY-MM形式で指定してください。")
            sys.exit(1)
    else:
        today = datetime.now()
        first_of_month = today.replace(day=1)
        last_month = first_of_month - timedelta(days=1)
        return last_month.year, last_month.month


# ---------------------------------------------------------------------------
# 設定ファイル読み込み
# ---------------------------------------------------------------------------

def load_teams_config(script_dir):
    """スクリプトと同ディレクトリの teams.yaml を読み込む。

    引数:
        script_dir: スクリプトおよびteams.yamlが配置されたディレクトリ。

    戻り値:
        (subscription_id, teams_list) のタプル。
    """
    yaml_path = os.path.join(script_dir, "teams.yaml")
    print(f"[INFO] チーム設定ファイルを読み込み中: {yaml_path}")

    if not os.path.exists(yaml_path):
        print(f"[ERROR] teams.yaml が見つかりません: {yaml_path}")
        sys.exit(1)

    with open(yaml_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    subscription_id = config.get("subscription_id")
    if not subscription_id:
        print("[ERROR] teams.yaml に 'subscription_id' が必要です")
        sys.exit(1)

    teams = config.get("teams", [])
    print(f"[INFO] {len(teams)} チームを読み込みました:")
    for team in teams:
        print(f"  - {team['name']}: {team['resource_groups']}")

    return subscription_id, teams


# ---------------------------------------------------------------------------
# Azure Cost Management API 呼び出し
# ---------------------------------------------------------------------------

API_VERSION = "2023-11-01"


def build_cost_query(year, month, with_no_pay_filter=False):
    """Cost Management APIのクエリペイロードを構築する。

    引数:
        year: 対象年。
        month: 対象月。
        with_no_pay_filter: Trueの場合、no-pay:trueタグのリソースでフィルタリング。

    戻り値:
        APIクエリボディを表すDict。
    """
    _, last_day = monthrange(year, month)
    from_date = f"{year:04d}-{month:02d}-01"
    to_date = f"{year:04d}-{month:02d}-{last_day:02d}"

    query = {
        "type": "ActualCost",
        "timeframe": "Custom",
        "timePeriod": {
            "from": from_date,
            "to": to_date
        },
        "dataset": {
            "granularity": "None",
            "aggregation": {
                "totalCost": {
                    "name": "Cost",
                    "function": "Sum"
                }
            },
            "grouping": [
                {
                    "type": "Dimension",
                    "name": "ResourceGroupName"
                }
            ]
        }
    }

    if with_no_pay_filter:
        query["dataset"]["filter"] = {
            "tags": {
                "name": "no-pay",
                "operator": "In",
                "values": ["true"]
            }
        }

    return query


def call_cost_management_api(token, subscription_id, query, label):
    """Azure Cost Management APIを呼び出し、ページネーションを処理する。

    引数:
        token: Azure Bearerトークン。
        subscription_id: AzureサブスクリプションID。
        query: APIクエリボディのDict。
        label: ログおよびファイル名用のラベル。

    戻り値:
        (columns, all_rows) のタプル。
    """
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/providers/Microsoft.CostManagement/query"
        f"?api-version={API_VERSION}"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print(f"\n[INFO] {'=' * 50}")
    print(f"[INFO] APIリクエスト: {label}")
    print(f"[INFO] URL: {url}")
    print(f"[INFO] {'=' * 50}")

    all_rows = []
    columns = None
    page = 1
    raw_responses = []

    current_url = url
    while current_url:
        print(f"[INFO] ページ {page} を取得中...")

        if page == 1:
            response = requests.post(current_url, headers=headers, json=query)
        else:
            # ページネーション: nextLinkはGETで取得
            response = requests.get(current_url, headers=headers)

        if response.status_code != 200:
            print(f"[ERROR] APIリクエストが失敗しました (ステータス: {response.status_code})")
            print(f"[ERROR] レスポンス: {response.text}")
            sys.exit(1)

        data = response.json()
        raw_responses.append(data)

        props = data.get("properties", {})
        if columns is None:
            columns = props.get("columns", [])

        rows = props.get("rows", [])
        all_rows.extend(rows)
        print(f"[INFO] ページ {page}: {len(rows)} 行を取得")

        current_url = props.get("nextLink")
        page += 1

    print(f"[INFO] '{label}' の合計取得行数: {len(all_rows)}")

    # デバッグ用にレスポンスをJSONファイルに保存
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_filename = f"raw_api_data_{label}_{timestamp}.json"
    raw_filepath = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), raw_filename
    )
    with open(raw_filepath, "w", encoding="utf-8") as f:
        json.dump(raw_responses, f, indent=2, ensure_ascii=False)
    print(f"[INFO] APIレスポンス(生データ)を保存しました: {raw_filepath}")

    return columns, all_rows


# ---------------------------------------------------------------------------
# コストデータ解析
# ---------------------------------------------------------------------------

def parse_cost_rows(columns, rows):
    """APIレスポンスの行データを {rg_name: cost} のDictに変換する。

    引数:
        columns: APIレスポンスのカラム定義。
        rows: APIレスポンスのデータ行。

    戻り値:
        小文字のリソースグループ名をキー、コストを値とするDict。
    """
    cost_idx = None
    rg_idx = None

    for i, col in enumerate(columns):
        name = col.get("name", "").lower()
        if name == "cost":
            cost_idx = i
        elif name == "resourcegroupname":
            rg_idx = i

    if cost_idx is None or rg_idx is None:
        print(f"[WARNING] 期待するカラムが見つかりません。カラム一覧: {columns}")
        return {}

    result = {}
    for row in rows:
        rg_name = row[rg_idx].lower() if row[rg_idx] else ""
        cost = float(row[cost_idx])
        result[rg_name] = result.get(rg_name, 0.0) + cost

    return result


# ---------------------------------------------------------------------------
# コスト按分ロジック
# ---------------------------------------------------------------------------

def allocate_costs(teams, rg_costs, no_pay_costs, external_cost):
    """按分ルールに基づき、各チームへコストを割り当てる。

    按分ルール:
    - no-payタグ付きコストをRGコストから差し引く。
    - teams.yamlに定義済みのRG → 該当チームの直接費用。
    - 未定義のRG → 共通費用プール。
    - 共通費用の按分:
        - N >= 2チーム: 共通費用 / N を各チームに配分
        - N <  2チーム: 共通費用 / 2 を各チームに配分、残額は共通部門負担

    引数:
        teams: teams.yamlから読み込んだチーム定義のリスト。
        rg_costs: 全RGの {rg_name: cost} Dict。
        no_pay_costs: no-payタグ付きリソースの {rg_name: cost} Dict。
        external_cost: 外部共通費用（--cost引数、省略可能）。

    戻り値:
        チーム別請求明細のDictリスト。
    """
    print(f"\n[INFO] {'=' * 50}")
    print(f"[INFO] コスト按分処理")
    print(f"[INFO] {'=' * 50}")

    # -----------------------------------------------------------------------
    # ステップ1: no-payタグ費用をRG費用から差し引く
    # -----------------------------------------------------------------------
    print("\n[INFO] ステップ1: no-payタグ費用をRG費用から差し引き")
    adjusted_costs = {}
    for rg, cost in rg_costs.items():
        no_pay = no_pay_costs.get(rg, 0.0)
        adjusted = cost - no_pay
        adjusted_costs[rg] = adjusted
        if no_pay > 0:
            print(f"  {rg}: {cost:.2f} - {no_pay:.2f} (no-pay除外) = {adjusted:.2f}")
        else:
            print(f"  {rg}: {cost:.2f} (no-pay控除なし)")

    # -----------------------------------------------------------------------
    # ステップ2: RG→チームのマッピング構築とコスト分類
    # -----------------------------------------------------------------------
    rg_to_team = {}
    for team in teams:
        for rg in team["resource_groups"]:
            rg_to_team[rg.lower()] = team["name"]

    team_direct_costs = {team["name"]: 0.0 for team in teams}
    shared_cost_total = 0.0
    shared_rgs = []

    print("\n[INFO] ステップ2: RG費用の分類 (直接費用 vs 共通費用)")
    for rg, cost in sorted(adjusted_costs.items()):
        if rg in rg_to_team:
            team_name = rg_to_team[rg]
            team_direct_costs[team_name] += cost
            print(f"  [直接] {rg} -> {team_name}: {cost:.2f}")
        else:
            shared_cost_total += cost
            shared_rgs.append((rg, cost))
            print(f"  [共通] {rg}: {cost:.2f}")

    print(f"\n[INFO] チーム別直接費用:")
    for name, cost in team_direct_costs.items():
        print(f"  {name}: {cost:.2f}")

    print(f"\n[INFO] 共通RG費用合計: {shared_cost_total:.2f}")
    if shared_rgs:
        for rg, cost in shared_rgs:
            print(f"  - {rg}: {cost:.2f}")

    # -----------------------------------------------------------------------
    # ステップ3: 共通費用の按分計算
    # -----------------------------------------------------------------------
    num_teams = len(teams)
    ext_cost = external_cost if external_cost is not None else 0.0
    total_shared = shared_cost_total + ext_cost

    print(f"\n[INFO] ステップ3: 共通費用の按分")
    print(f"  共通RG費用:             {shared_cost_total:.2f}")
    print(f"  外部共通費用 (--cost):  {ext_cost:.2f}")
    print(f"  按分対象合計:           {total_shared:.2f}")
    print(f"  チーム数 (N):           {num_teams}")

    common_dept_charge = 0.0

    if num_teams >= 2:
        per_team_shared = total_shared / num_teams
        print(f"  ルール: N >= 2 -> {total_shared:.2f} / {num_teams} = "
              f"{per_team_shared:.2f} (チームあたり)")
    else:
        per_team_shared = total_shared / 2
        common_dept_charge = total_shared - (per_team_shared * num_teams)
        print(f"  ルール: N < 2 (特殊) -> 各チーム {total_shared:.2f} / 2 "
              f"= {per_team_shared:.2f}")
        print(f"  共通部門負担額: {common_dept_charge:.2f}")

    # -----------------------------------------------------------------------
    # ステップ4: 最終結果の構築
    # -----------------------------------------------------------------------
    print(f"\n[INFO] ステップ4: 最終請求サマリー")
    results = []

    for team in teams:
        name = team["name"]
        direct = team_direct_costs[name]
        shared = per_team_shared
        total = direct + shared
        results.append({
            "team_name": name,
            "direct_cost": direct,
            "allocated_shared_cost": shared,
            "total_charge": total
        })
        print(f"\n  {name}:")
        print(f"    直接費用:         {direct:>12.2f}")
        print(f"    按分共通費用:     {shared:>12.2f}")
        print(f"    合計請求額:       {total:>12.2f}")

    # N < 2 の場合、共通部門行を追加
    if num_teams < 2 and common_dept_charge > 0:
        results.append({
            "team_name": "Common Department",
            "direct_cost": 0.0,
            "allocated_shared_cost": common_dept_charge,
            "total_charge": common_dept_charge
        })
        print(f"\n  共通部門:")
        print(f"    直接費用:         {0.0:>12.2f}")
        print(f"    按分共通費用:     {common_dept_charge:>12.2f}")
        print(f"    合計請求額:       {common_dept_charge:>12.2f}")

    return results


# ---------------------------------------------------------------------------
# CSV出力
# ---------------------------------------------------------------------------

def write_csv(results, year, month):
    """請求レポートCSVを出力する。

    引数:
        results: allocate_costs()から返された結果Dictのリスト。
        year: 対象年。
        month: 対象月。

    戻り値:
        出力ファイルパス。
    """
    date_str = f"{year:04d}-{month:02d}"
    filename = f"billing_report_{date_str}.csv"
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)

    print(f"\n[INFO] {'=' * 50}")
    print(f"[INFO] CSVレポート出力中: {filepath}")
    print(f"[INFO] {'=' * 50}")

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Team Name",
            "Direct Cost",
            "Allocated Shared Cost",
            "Total Charge"
        ])
        for row in results:
            writer.writerow([
                row["team_name"],
                f"{row['direct_cost']:.2f}",
                f"{row['allocated_shared_cost']:.2f}",
                f"{row['total_charge']:.2f}"
            ])
            print(f"  {row['team_name']}: "
                  f"直接={row['direct_cost']:.2f}, "
                  f"按分={row['allocated_shared_cost']:.2f}, "
                  f"合計={row['total_charge']:.2f}")

    print(f"\n[INFO] CSVレポートを保存しました: {filepath}")
    return filepath


# ---------------------------------------------------------------------------
# メイン処理
# ---------------------------------------------------------------------------

def main():
    """メインエントリーポイント。"""
    print("=" * 60)
    print(" Azure Cost Management - チーム別按分請求")
    print("=" * 60)

    # --- 引数解析 ---
    args = parse_args()
    year, month = get_target_date(args.date)
    date_str = f"{year:04d}-{month:02d}"
    print(f"\n[INFO] 対象期間: {date_str}")
    if args.cost is not None:
        print(f"[INFO] 外部共通費用: {args.cost:.2f}")

    # --- 設定ファイル読み込み ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    subscription_id, teams = load_teams_config(script_dir)
    print(f"[INFO] サブスクリプションID: {subscription_id}")

    # --- API呼び出し①: RG単位のActualCost ---
    query_rg = build_cost_query(year, month, with_no_pay_filter=False)
    columns_rg, rows_rg = call_cost_management_api(
        args.token, subscription_id, query_rg, "rg_costs"
    )
    rg_costs = parse_cost_rows(columns_rg, rows_rg)

    print(f"\n[INFO] RG費用サマリー ({len(rg_costs)} リソースグループ):")
    for rg, cost in sorted(rg_costs.items()):
        print(f"  {rg}: {cost:.2f}")

    # --- API呼び出し②: no-payタグ付きリソース ---
    query_nopay = build_cost_query(year, month, with_no_pay_filter=True)
    columns_nopay, rows_nopay = call_cost_management_api(
        args.token, subscription_id, query_nopay, "no_pay_costs"
    )
    no_pay_costs = parse_cost_rows(columns_nopay, rows_nopay)

    print(f"\n[INFO] No-Payタグ付き費用サマリー:")
    if no_pay_costs:
        for rg, cost in sorted(no_pay_costs.items()):
            print(f"  {rg}: {cost:.2f}")
    else:
        print("  (なし)")

    # --- コスト按分 ---
    results = allocate_costs(teams, rg_costs, no_pay_costs, args.cost)

    # --- CSVレポート出力 ---
    write_csv(results, year, month)

    print("\n" + "=" * 60)
    print(" 完了!")
    print("=" * 60)


if __name__ == "__main__":
    main()
