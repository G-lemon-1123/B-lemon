#include<iostream>
#include<fstream>
using namespace std;
int main()
{
	ofstream fout("DX126E03_4.txt");
	if (!fout)
	{
		cout << "文件打开失败！\n";
		return 1;
	}
	int a, b, n;
	while (true)
	{
		cout << "请输入三个数：分子、分母、小数点后的位数\n";
		cin >> a >> b >> n;
		if (a == 0 || b == 0 || n == 0)
		{
			fout << "Over!See you next time!\n";
			cout << "Over!See you next time\n";
			break;
		}
		fout << a << "/" << b << "小数形式为：\n";
		int intPart = a\b;
		int rem = a % b;
		fout << intPart;
		if (rem == 0)
		{
			fout << "\n";
			continue;
		}
		fout << ".";
		int cnt = 0;
		for (int i = 0; i < n; i++)
		{
			rem *= 10;
			int bit = rem / b;
			rem = rem % b;
			fout << bit;
			cnt++;
			if (cnt % 20 == 0)
				fout << "\n";
		}
		if (cnt % 20 != 0)
			fout << "\n";
	}
	fout.close();
	return 0;
}