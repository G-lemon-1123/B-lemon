#include<iostream>
#include<cmath>
#include<iomanip>
using namespace std;
int main()
{
	double x0;
	const double eps = 1e-6;
	while (true)
	{
		cout << "Please enter an initial value(zero for stop):";
		cin >> x0;
		if (fabs(x0) < 1e-12)break;
		int cnt = 0;
		double x1;
		while (true)
		{
			double num = x0 * x0 - 10 * (x0*sin(x0) + cos(x0));
			double den = 2 * x0 - 10 * sin(x0);
			x1 = num / den;
			cnt++;
			cout << setw(10) << x1;
			if (cnt % 4 == 0)cout << endl;
			if (fabs(x1 - x0) < eps)
			{
				if (cnt % 4 != 0)cout << endl;
				break;
			}
			x0 = x1;
		}
		cout << "该方程的最终的根为：" << x1 << "迭代次数为" << cnt << endl;
	}
	return 0;
}