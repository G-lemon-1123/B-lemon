#include<iostream>
using namespace std;
int main()
{
	double x;
	int n;
	cout << "请输入一个实数" << endl;
	cin >> x;
	do
	{
		cout << "请输入大于等于10的整数n值：" << endl;
		cin >> n;
	} while (n < 10);
	double sum = 1.0;
	double t = 1.0;
	for (int k = 1; k <= n; k++)
	{
		t = t * x / k;
		sum += t;
	}
	cout << "e的" << x << "次方的近似值为：" << sum << endl;
	return 0;
}