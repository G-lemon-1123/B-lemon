#include<iostream>
#include<cmath>
using namespace std;
int main()
{
	int n;
	cout << "请输入1~7中的一个数字：";
	cin >> n;
	if (n < 1 || n>7)
	{
		cout << "无效数字";
	}
	else
		switch (n)
		{
		case 1:cout << "星期一" << endl; break;
		case 2:cout << "星期二" << endl; break;
		case 3:cout << "星期三" << endl; break;
		case 4:cout << "星期四" << endl; break;
		case 5:cout << "星期五" << endl; break;
		case 6:cout << "星期六" << endl; break;
		case 7:cout << "星期七" << endl; break;
		}
				return 0;
}