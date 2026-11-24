#include<iostream>
using namespace std;
int CountJi(int n)
{
	int c = 0;
	while (n != 0)
	{
		int d = n % 10;
		if (d % 2 == 1)
		{
			c++;
		}
		n = n / 10;
	}
	return c;
}
void DigitStatis()
{
	int num;
	cout << "请输入一个4~9位的整数：" << endl;
	cin >> num;
	int num1;
	int len = 0;
	num1 = num;
	while (num1 != 0)
	{
		len++;
		num1 = num1 / 10;
	}
	while (len < 4 || len>9)
	{
		cout << "不合法，请重新输入：" << endl;
		cin >> num;
		while (num1 != 0)
		{
			len++;
			num1 = num1 / 10;
		}
	}
	cout << "各位奇数数字的个数：" << CountJi(num) << endl;
}
int main()
{
	for (int i = 1; i <= 10; i++)
	{
		cout << "=========第" << i << "次测试============" << endl;
		DigitStatis();
	}
	return 0;
}