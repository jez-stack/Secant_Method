import math
import os
from flask import Flask, render_template, request, jsonify

# ------------------------------------------------------------------
# Flask application configuration
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))


# ------------------------------------------------------------------
# Safe mathematical evaluator
# ------------------------------------------------------------------
def safe_eval(expr, x):
    """
    Safely evaluate a mathematical expression at a given x.

    Args:
        expr (str): Python‑compatible expression (e.g., 'x**2-4').
        x (float): Value to substitute for the variable 'x'.

    Returns:
        float: Result of the evaluation.

    Raises:
        ValueError: If evaluation fails.
    """
    allowed_names = {
        'x': x,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'exp': math.exp,
        'log': math.log,
        'sqrt': math.sqrt,
        'pi': math.pi,
        'e': math.e,
        'abs': math.fabs,
        'pow': math.pow
    }

    try:
        return eval(expr, {"__builtins__": {}}, allowed_names)
    except Exception as e:
        raise ValueError(f"Error evaluating function: {e}")


# ------------------------------------------------------------------
# Secant method implementation
# ------------------------------------------------------------------
def secant_method(f_str, x0, x1, tol=1e-6, max_iter=50):
    """
    Perform the secant method to find a root of f(x)=0.

    Args:
        f_str (str): Python function expression (e.g., 'x**2-4').
        x0 (float): First initial guess.
        x1 (float): Second initial guess.
        tol (float): Tolerance for convergence.
        max_iter (int): Maximum number of iterations.

    Returns:
        tuple: (iterations list, root approximation)

    Raises:
        ValueError: If division by near‑zero or non‑convergence.
    """
    iterations = []
    x_prev = x0
    x_curr = x1
    f_prev = safe_eval(f_str, x_prev)
    f_curr = safe_eval(f_str, x_curr)

    # First iteration (n=1)
    if abs(f_curr - f_prev) < 1e-14:
        raise ValueError("Division by near‑zero difference")

    x_next = x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)
    f_next = safe_eval(f_str, x_next)
    error = abs(x_next - x_curr)

    iterations.append({
        'n': 1,
        'x_n': x_prev,
        'f_x_n': f_prev,
        'x_n1': x_curr,
        'f_x_n1': f_curr,
        'x_next': x_next,
        'f_next': f_next,
        'error': error,
        'step': (
            f"x₂ = {x_curr} - ({f_curr})×({x_curr}-{x_prev})/"
            f"({f_curr}-({f_prev})) = {x_next}"
        )
    })

    if error < tol:
        return iterations, x_next

    # Shift for next iteration
    x_prev, f_prev = x_curr, f_curr
    x_curr, f_curr = x_next, f_next

    for n in range(2, max_iter + 1):
        if abs(f_curr - f_prev) < 1e-14:
            raise ValueError("Division by near‑zero difference")

        x_next = x_curr - f_curr * (x_curr - x_prev) / (f_curr - f_prev)
        f_next = safe_eval(f_str, x_next)
        error = abs(x_next - x_curr)

        step_str = (
            f"x{n+1} = {x_curr} - ({f_curr})×({x_curr}-{x_prev})/"
            f"({f_curr}-({f_prev})) = {x_next}"
        )

        iterations.append({
            'n': n,
            'x_n': x_prev,
            'f_x_n': f_prev,
            'x_n1': x_curr,
            'f_x_n1': f_curr,
            'x_next': x_next,
            'f_next': f_next,
            'error': error,
            'step': step_str
        })

        if error < tol:
            return iterations, x_next

        x_prev, f_prev = x_curr, f_curr
        x_curr, f_curr = x_next, f_next

    raise ValueError(f"Method did not converge within {max_iter} iterations.")


# ------------------------------------------------------------------
# Route: Homepage
# ------------------------------------------------------------------
@app.route('/')
def index():
    """Render the home page."""
    return render_template('index.html')


# ------------------------------------------------------------------
# Route: Secant method calculator page
# ------------------------------------------------------------------
@app.route('/secant')
def secant_page():
    """Render the Secant method calculator page."""
    return render_template('secant.html')


# ------------------------------------------------------------------
# API endpoint: Secant method calculation
# ------------------------------------------------------------------
@app.route('/calculate/secant', methods=['POST'])
def calculate_secant():
    """
    API endpoint that receives function and parameters,
    runs the secant method, and returns JSON with results.
    """
    data = request.json
    f_expr = data.get('function', '').strip()

    # Parse input numbers
    try:
        x0 = float(data.get('x0'))
        x1 = float(data.get('x1'))
        tol = float(data.get('tol', 1e-6))
        max_iter = int(data.get('max_iter', 50))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid numeric inputs.'}), 400

    # Validation
    if x0 == x1:
        return jsonify({'error': 'x₀ and x₁ must be different values.'}), 400
    if tol <= 0:
        return jsonify({'error': 'Tolerance must be positive.'}), 400
    if max_iter < 1:
        return jsonify({'error': 'Max iterations must be at least 1.'}), 400

    try:
        iterations, root = secant_method(f_expr, x0, x1, tol, max_iter)
        # Round for cleaner display
        for it in iterations:
            for key in ['x_n', 'f_x_n', 'x_n1', 'f_x_n1', 'error']:
                if it[key] is not None:
                    it[key] = round(it[key], 10)
        return jsonify({
            'root': round(root, 10),
            'iterations': iterations,
            'converged': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ------------------------------------------------------------------
# Local development server
# ------------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)