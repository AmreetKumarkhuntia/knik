"""
Graph utility functions for DAG operations.
"""

from collections import defaultdict, deque
from typing import Any


def is_dag_acyclic(nodes: dict[str, Any], connections: list[dict[str, Any]]) -> bool:
    """Check if a directed graph is acyclic using Kahn's algorithm.

    Takes raw workflow-style nodes and connections and determines whether
    the graph they form is a valid DAG (directed acyclic graph).

    Args:
        nodes: Dictionary of node_id -> node_data. Only the keys are used
               for the acyclicity check.
        connections: List of connection dicts, each with 'from_id' and 'to_id' keys.

    Returns:
        True if the graph is acyclic (valid DAG), False if it contains cycles.
    """
    if not nodes:
        return True

    adj_list: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = dict.fromkeys(nodes, 0)

    for conn in connections:
        from_id = conn["from_id"]
        to_id = conn["to_id"]
        adj_list[from_id].append(to_id)
        in_degree[to_id] = in_degree.get(to_id, 0) + 1

    queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
    visited_count = 0

    while queue:
        node = queue.popleft()
        visited_count += 1

        for neighbor in adj_list[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited_count == len(nodes)
