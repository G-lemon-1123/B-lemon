#include<iostream>
using namespace std;
int Peach(int n, int k)
{
	if (k == n)
		return 1;
	else
		return 2 * (Peach(n, k + 1) + 1);
}
int main()
{
	int n,k;
	cout << "猴子摘桃问题，请输入只剩一个桃子的天数n：" << endl;
	cin >> n;
	if(n<=0)
	{
		cout << "天数必须为正整数！" << endl;
		return 1;
	}
	cout << "请输入要查看第几天桃子的数量：" << endl;
	cin >> k;
	if (k<1 || k>n)
	{
		cout << "k必须介于1~n之间！" << endl;
		return 1;
	}
	cout << "第" << k << "天剩余的桃子的数量为" << Peach(n, k) << endl;
	return 0;
}