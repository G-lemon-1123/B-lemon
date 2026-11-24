#include<iostream>
using namespace std;
int main()
{
	double money,tax;
	cout << "请输入你的月收入：" << endl;
	cin >> money;
	if (money < 0)
		cout << "无效金额" << endl;
	else if (money < 5000)
		tax = 0;
	else if (money <= 8000)
		tax = (money - 5000)*0.03;
	else if (money <= 17000)
		tax = 3000 * 0.03 + (money - 8000)*0.10;
	else if (money <= 30000)
		tax = 3000 * 0.03 + 9000 * 0.10 + (money - 17000)*0.20;
	else if (money <= 40000)
		tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + (money - 30000)*0.25;
	else if (money <= 60000)
		tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + (money - 40000) * 0.30;
	else if (money <= 85000)
		tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + 20000 * 0.30 + (money - 60000)*0.35;
	else tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + 20000 * 0.30 + 25000 * 0.35 + (money - 85000)*0.45;
	cout << "您应缴税值为：" << tax << endl;
		return 0;
}