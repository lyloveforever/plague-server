import express from 'express'
const router = express.Router({})

import conn from './../db/db'
import config from '../src/config'
import sms_util from './../util/sms_util'
const alipaySdk = require('./../util/alipayutil');
const AlipayFormData = require('alipay-sdk/lib/form').default; // alipay.trade.page.pay 返回的内容为 Form 表单

import svgCaptcha from 'svg-captcha'
import md5 from 'blueimp-md5'
import formidable from 'formidable'
import {
    basename
} from 'path'
import {
    timeStamp
} from 'console'

const S_KEY = '@WaLQ1314?.LqFtK.Com.#'; // 密钥
const users = {}; // 用户信息
let tmp_captcha = '';

/* GET home page. */
router.get('/', (req, res, next) => {
    console.log(md5(md5("admin") + S_KEY))
    res.render('index', {
        title: '乐购商城'
    });
});

/**************************************** 前台商城 ****************************************** */
/**
 * 获取首页轮播图
 */
router.get('/api/homecasual', (req, res) => {
    let sqlStr = 'SELECT * FROM homecasual';
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '请求轮播图数据失败'
            });
            console.log(error);
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 获取商品分类数
 */
router.get('/api/category', (req, res) => {
    let sqlStr = 'SELECT * FROM category';
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '请求商品分类数据失败'
            });
            console.log(error);
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 模糊搜索(商品名称)
 */
router.post('/api/searchgoods', (req, res) => {
    // 获取参数
    let keywords = req.body.keywords;
    keywords = keywords.replace(/\s+/g, ' ');
    keywords = keywords.replace(/(^\s*)|(\s*$)/g, '');
    let keyArr = keywords.split(' ');
    let sqlStr = 'SELECT * FROM recommend WHERE goods_name LIKE '; // sql语句
    keyArr.forEach((item, index, arr) => {
        sqlStr += "'%" + item + "%'";
        if (index != arr.length - 1) {
            sqlStr += " OR goods_name LIKE ";
        }
    });
    conn.query(sqlStr, (error, results, fields) => {
        results = JSON.parse(JSON.stringify(results));
        if (!error && results.length) {
            res.json({
                success_code: 200,
                message: results
            });
        } else {
            console.log(error);
        }
    });
});

/**
 * 获取推荐商品列表
 *  1, 3
 */
router.get('/api/recommendshoplist', (req, res) => {
    // 获取参数
    let category = req.query.category || 1
    let pageNo = req.query.pageNo || 1;
    let pageSize = req.query.count || 3;
    let sqlStr = 'SELECT * FROM recommend WHERE category = ' + category + ' LIMIT ' + (pageNo - 1) * pageSize + ',' + pageSize;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '请求商品列表数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 获取所有商品
 */
router.get('/api/allgoods', (req, res) => {

    let sqlStr = 'SELECT * FROM recommend';

    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '请求商品数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 获取首页商品列表
 */
router.get('/api/homeshoplist', (req, res) => {
    // 获取总分类
    let cateSqlStr = 'SELECT COUNT(*) FROM category';
    conn.query(cateSqlStr, (error, results, fields) => {
        if (!error) {
            let sqlStr = '';
            for (let i = 0; i < results[0]['COUNT(*)']; i++) {
                sqlStr += 'SELECT * FROM recommend WHERE category = ' + (i + 1) + ' LIMIT 3;';
            }
            conn.query(sqlStr, (error, results, fields) => {
                if (!error) {
                    results = JSON.parse(JSON.stringify(results));
                    res.json({
                        success_code: 200,
                        message: results
                    });
                }
            });
        }
    });
});

/**
 * 获取商品详细信息
 */
router.get('/api/goodsdetail', (req, res) => {
    // 获取参数
    let goodsNo = req.query.goodsNo;
    let sqlStr = 'SELECT * FROM recommend WHERE goods_id = ' + goodsNo;
    conn.query(sqlStr, (error, results, fields) => {
        if (!error) {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 获取商品评价
 */
router.get('/api/goodscomment', (req, res) => {
    // 获取参数
    let goodsId = req.query.goodsId;

    let sqlStr = 'SELECT user_info.id, user_info.user_name, user_info.user_nickname, comments.comment_detail, comments.comment_id, comments.comment_rating, comments.goods_id FROM user_info INNER JOIN comments ON user_info.id = comments.user_id WHERE goods_id = ' + goodsId;
    conn.query(sqlStr, (error, results, fields) => {
        if (!error) {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
  评论商品
*/
router.post('/api/postcomment', (req, res) => {
    // 获取参数
    let goods_id = req.body.goods_id;
    let comment_detail = req.body.comment_detail;
    let comment_rating = req.body.comment_rating;
    let user_id = req.body.user_id;
    const addSql = "INSERT INTO comments(goods_id, comment_detail, comment_rating, user_id) VALUES (?, ?, ?, ?)";
    const addSqlParams = [goods_id, comment_detail, comment_rating, user_id];
    conn.query(addSql, addSqlParams, (error, results, fields) => {
        results = JSON.parse(JSON.stringify(results));
        if (!error) {
            // 更新数据
            let sqlStr = "UPDATE recommend SET comments_count = comments_count + 1 WHERE goods_id = " + goods_id;
            conn.query(sqlStr, (error, results, fields) => {
                if (error) {
                    console.log(error);
                } else {
                    res.json({
                        success_code: 200,
                        message: "发布成功"
                    });
                }
            });
        }
    });
});

/**
 一次性图形验证码
*/
router.get('/api/captcha', (req, res) => {
    // 生成随机验证码
    let captcha = svgCaptcha.create({
        color: true,
        noise: 3,
        ignoreChars: '0o1iIO',
        size: 4
    });

    // 保存
    req.session.captcha = captcha.text.toLocaleLowerCase();
    tmp_captcha = captcha.text.toLocaleLowerCase();

    // 返回客户端
    res.type('svg');
    res.send(captcha.data);
});

/**
  发送验证码短信
*/
router.get('/api/send_code', (req, res) => {
    // 获取手机号码
    let phone = req.query.phone;
    // 随机产生验证码
    let code = sms_util.randomCode(6);

    /* sms_util.sendCode(phone, code, function (success) {
        if (success) {
             users[phone] = code;
             res.json({success_code: 200, message: '验证码获取成功!'});
         } else {
             res.json({err_code: 0, message: '验证码获取失败!'});
         }
     });*/

    // 成功——模拟短信功能
    setTimeout(() => {
        users[phone] = code;
        res.json({
            success_code: 200,
            message: code
        });
    }, 2000);
});

/**
  手机验证码登录
*/
router.post('/api/login_code', (req, res) => {
    // 获取数据
    const phone = req.body.phone;
    const code = req.body.code;

    // 验证验证码是否正确
    if (users[phone] !== code) {
        res.json({
            err_code: 0,
            message: '验证码不正确!'
        });
    }

    // 查询数据
    delete users[phone];

    let sqlStr = "SELECT * FROM user_info WHERE user_phone = '" + phone + "' LIMIT 1";

    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '查询失败'
            });
            console.log(error);
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 用户已经存在
                if (results[0].user_status == 0) {
                    res.json({
                        err_code: 301,
                        message: '用户已冻结!'
                    });
                } else {
                    req.session.userId = results[0].id;
                    res.json({
                        success_code: 200,
                        message: {
                            id: results[0].id,
                            user_name: results[0].user_name,
                            user_nickname: results[0].user_nickname || '',
                            user_phone: results[0].user_phone,
                            user_sex: results[0].user_sex,
                            user_address: results[0].user_address,
                            user_sign: results[0].user_sign,
                            user_birthday: results[0].user_birthday,
                            user_avatar: results[0].user_avatar
                        }
                    });
                }
            } else { // 新用户
                const addSql = "INSERT INTO user_info(user_name, user_phone, user_avatar) VALUES (?, ?, ?)";
                const addSqlParams = [phone, phone, 'http://localhost:' + config.port + '/avatar_uploads/avatar_default.jpg']; // 手机验证码注册，默认用手机号充当用户名
                conn.query(addSql, addSqlParams, (error, results, fields) => {
                    results = JSON.parse(JSON.stringify(results));
                    if (!error) {
                        req.session.userId = results.insertId;
                        let sqlStr = "SELECT * FROM user_info WHERE id = '" + results.insertId + "' LIMIT 1";
                        conn.query(sqlStr, (error, results, fields) => {
                            if (error) {
                                res.json({
                                    err_code: 0,
                                    message: '注册失败'
                                });
                                console.log(error);
                            } else {
                                results = JSON.parse(JSON.stringify(results));

                                res.json({
                                    success_code: 200,
                                    message: {
                                        id: results[0].id,
                                        user_name: results[0].user_name,
                                        user_phone: results[0].user_phone,
                                        user_avatar: results[0].user_avatar
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });

});

/**
 * 用户名和密码登录
 */
router.post('/api/login_pwd', (req, res) => {
    // console.log(req.session.captcha);
    // console.log(tmp_captcha);
    // 获取数据
    const user_name = req.body.name;
    const user_pwd = md5(md5(req.body.pwd) + S_KEY);
    const captcha = req.body.captcha.toLowerCase();

    // 验证图形验证码是否正确
    if (captcha !== tmp_captcha) {
        res.json({
            err_code: 0,
            message: '图形验证码不正确!'
        });
        return;
    }

    tmp_captcha = '';

    // 查询数据
    let sqlStr = "SELECT * FROM user_info WHERE user_name = '" + user_name + "' LIMIT 1";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '用户名不正确!'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 用户已经存在
                if (results[0].user_status == 0) {
                    res.json({
                        err_code: 301,
                        message: '用户已冻结!'
                    });
                } else {
                    // 验证密码是否正确
                    if (results[0].user_pwd !== user_pwd) {
                        res.json({
                            err_code: 0,
                            message: '密码不正确!'
                        });
                    } else {
                        req.session.userId = results[0].id;
                        res.json({
                            success_code: 200,
                            message: {
                                id: results[0].id,
                                user_name: results[0].user_name || '',
                                user_nickname: results[0].user_nickname || '',
                                user_phone: results[0].user_phone || '',
                                user_sex: results[0].user_sex || '',
                                user_address: results[0].user_address || '',
                                user_sign: results[0].user_sign || '',
                                user_birthday: results[0].user_birthday || '',
                                user_avatar: results[0].user_avatar || ''
                            },
                            info: '登录成功!'
                        });
                    }
                }
            } else { // 新用户
                const addSql = "INSERT INTO user_info(user_name, user_pwd, user_avatar) VALUES (?, ?, ?)";
                const addSqlParams = [user_name, user_pwd, 'http://localhost:' + config.port + '/avatar_uploads/avatar_default.jpg'];
                conn.query(addSql, addSqlParams, (error, results, fields) => {
                    results = JSON.parse(JSON.stringify(results));
                    if (!error) {
                        req.session.userId = results.insertId;
                        let sqlStr = "SELECT * FROM user_info WHERE id = '" + results.insertId + "' LIMIT 1";
                        conn.query(sqlStr, (error, results, fields) => {
                            if (error) {
                                res.json({
                                    err_code: 0,
                                    message: '注册失败'
                                });
                            } else {
                                results = JSON.parse(JSON.stringify(results));

                                res.json({
                                    success_code: 200,
                                    message: {
                                        id: results[0].id,
                                        user_name: results[0].user_name || '',
                                        user_nickname: results[0].user_nickname || '',
                                        user_avatar: results[0].user_avatar || ''
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

/**
 *  根据session中的用户id获取用户信息
 * */
router.get('/api/user_info', (req, res) => {
    // 获取参数
    let userId = req.query.user_id || req.session.userId;

    let sqlStr = "SELECT * FROM user_info WHERE id = " + userId + " LIMIT 1";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '请求用户数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (!results[0]) {
                delete req.session.userId;
                res.json({
                    error_code: 1,
                    message: '请先登录'
                });
            } else {
                res.json({
                    success_code: 200,
                    message: {
                        id: results[0].id,
                        user_name: results[0].user_name || '',
                        user_nickname: results[0].user_nickname || '',
                        user_phone: results[0].user_phone || '',
                        user_sex: results[0].user_sex || '',
                        user_address: results[0].user_address || '',
                        user_sign: results[0].user_sign || '',
                        user_birthday: results[0].user_birthday || '',
                        user_avatar: results[0].user_avatar || ''
                    },
                });
            }
        }
    });
});

/**
 * 退出登录
 */
router.get('/api/logout', (req, res) => {
    // 清除session中userId
    delete req.session.userId;

    res.json({
        success_code: 200,
        message: "退出登录成功"
    });
});

/**
 * 添加商品到购物车
 */
router.post('/api/add_shop_cart', (req, res) => {
    // 验证用户
    let user_id = req.body.user_id;
    if (!user_id) {
        res.json({
            err_code: 0,
            message: '非法用户'
        });
        return;
    }
    /* if(!user_id || user_id !== req.session.userId){
		 console.log( req.session.userId);
         res.json({err_code:0, message:'非法用户'});
         return;
     }
	*/
    // 获取客户端传过来的商品信息
    let goods_id = req.body.goods_id;
    let goods_name = req.body.goods_name;
    let thumb_url = req.body.thumb_url;
    let price = req.body.price;
    let total_amount = req.body.total_amount;
    let buy_count = req.body.buy_count;
    let is_pay = 0; // 0 未购买 1购买
    let counts = req.body.counts;

    let sql_str = "SELECT * FROM cart WHERE goods_id = " + goods_id + " AND user_id=" + user_id + " LIMIT 1";
    conn.query(sql_str, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '服务器内部错误!'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 商品已经存在
                res.json({
                    success_code: 200,
                    message: '该商品已在购物车中'
                });
            } else { // 商品不存在
                let add_sql = "INSERT INTO cart(goods_id, goods_name, thumb_url, price, buy_count, total_amount, is_pay, user_id, counts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                let sql_params = [goods_id, goods_name, thumb_url, price, buy_count, total_amount, is_pay, user_id, counts];
                conn.query(add_sql, sql_params, (error, results, fields) => {
                    if (error) {
                        res.json({
                            err_code: 0,
                            message: '加入购物车失败!'
                        });
                        console.log(error);
                    } else {
                        res.json({
                            success_code: 200,
                            message: '加入购物车成功!'
                        });
                    }
                });
            }
        }
    });

});

/**
 * 查询购物车的商品
 */
router.get('/api/cart_goods', (req, res) => {
    // 获取参数
    let user_id = req.query.user_id;
    let sqlStr = "SELECT * FROM cart WHERE user_id =" + user_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '请求购物车商品数据失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**
 * 删除购物车单条商品
 */
router.post('/api/delete_goods', (req, res) => {
    // 获取数据
    const goods_id = req.body.goods_id;
    const user_id = req.body.user_id;

    let sqlStr = "DELETE FROM cart WHERE goods_id =" + goods_id + " AND user_id = " + user_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '删除失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功!'
            });
        }
    });
});


/**
 * 生成交易订单
 */
router.post('/api/create_trade', (req, res) => {
    let id;
    let user_id = req.body.user_id;
    let goods_name = req.body.goods_name;
    let buy_price = req.body.buy_price;
    let buy_count = req.body.buy_count;
    let total_amount = req.body.total_amount;
    let status = req.body.status;
    let goods_img = req.body.goods_img;
    let receive_address = req.body.receive_address;
    let receive_name = req.body.receive_name;
    let receive_phone = req.body.receive_phone;
    let remark = req.body.remark;
    let paymentWay = req.body.paymentWay;
    let sql = "select MAX(id) from shopping_record";
    conn.query(sql, (error, results, fields) => {
        let Max = Number(Object.values(results[0]));
        if (!error) {
            if (Max === null) {
                id = 1;
            } else {
                id = Max + 1;
            }
            //获取并格式化日期
            let date = new Date();
            let Y = date.getFullYear();
            let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
            let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
            //确定下单时间
            let create_date = new Date(+new Date() + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
            //生成订单编号
            let end = '00000' + id;
            let order_number = 'LGSC-' + Y + M + D + '-' + end.substr(end.length - 5, 5);
            let addsqlStr = "INSERT INTO shopping_record (id,user_id,goods_name,create_date,order_number,buy_price,buy_count,total_amount,status,goods_img,receive_address,receive_name,receive_phone,remark,paymentWay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
            let addsqlStrParams = [id, user_id, goods_name, create_date, order_number, buy_price, buy_count, total_amount, status, goods_img, receive_address, receive_name, receive_phone, remark, paymentWay];
            conn.query(addsqlStr, addsqlStrParams, (error, results, fields) => {
                if (!error) {
                    results = JSON.parse(JSON.stringify(results));
                    res.json({
                        success_code: 200,
                        message: '订单生成成功',
                        data: id
                    });
                } else {
                    res.json({
                        err_code: 0,
                        message: '订单生成失败'
                    });
                }
            });
        }
    });

});

/**  
 * 支付宝支付
 */
router.post('/api/pcpay', (req, res) => {
    let orderId = req.body.order_number;
    // * 添加购物车支付支付宝 */
    // 调用 setMethod 并传入 get，会返回可以跳转到支付页面的 url
    const formData = new AlipayFormData();
    formData.setMethod('get');
    // 通过 addField 增加参数
    // 在用户支付完成之后，支付宝服务器会根据传入的 notify_url，以 POST 请求的形式将支付结果作为参数通知到商户系统。
    formData.addField('notifyUrl', 'http://localhost:8080/paysuccess'); // 支付成功回调地址，必须为可以直接访问的地址，不能带参数
    formData.addField('bizContent', {
        outTradeNo: orderId, // 商户订单号,64个字符以内、可包含字母、数字、下划线,且不能重复
        productCode: 'FAST_INSTANT_TRADE_PAY', // 销售产品码，与支付宝签约的产品码名称,仅支持FAST_INSTANT_TRADE_PAY
        totalAmount: '0.01', // 订单总金额，单位为元，精确到小数点后两位
        subject: '商品', // 订单标题
        body: '商品详情', // 订单描述
    });
    formData.addField('returnUrl', 'https://opendocs.alipay.com'); //加在这里才有效果,不是加在bizContent 里面
    // 如果需要支付后跳转到商户界面，可以增加属性"returnUrl"
    const result = alipaySdk.exec( // result 为可以跳转到支付链接的 url
        'alipay.trade.page.pay', // 统一收单下单并支付页面接口
        {}, // api 请求的参数（包含“公共请求参数”和“业务参数”）
        {
            formData: formData
        },
    );
    result.then((resp) => {
        res.send({
            "success": true,
            "message": "success",
            "code": 200,
            "timestamp": (new Date()).getTime(),
            "result": resp
        })
    })

});

/**
 * 查询订单状态是否成功 
 */
router.post('/api/member/queryOrderAlipay', (req, res) => {
    let orderId = req.body.order_number
    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('bizContent', {
        orderId
    });
    // 通过该接口主动查询订单状态
    const result = alipaySdk.exec(
        'alipay.trade.query', {}, {
            formData: formData
        },
    );
    axios({
            method: 'GET',
            url: result
        })
        .then(data => {
            let r = data.data.alipay_trade_query_response;
            if (r.code === '10000') { // 接口调用成功
                switch (r.trade_status) {
                    case 'WAIT_BUYER_PAY':
                        res.send({
                            "success": true,
                            "message": "success",
                            "code": 200,
                            "timestamp": (new Date()).getTime(),
                            "result": {
                                "status": 0,
                                "massage": '交易创建，等待买家付款'
                            }
                        })
                        break;
                    case 'TRADE_CLOSED':
                        res.send({
                            "success": true,
                            "message": "success",
                            "code": 200,
                            "timestamp": (new Date()).getTime(),
                            "result": {
                                "status": 1,
                                "massage": '未付款交易超时关闭，或支付完成后全额退款'
                            }
                        })
                        break;
                    case 'TRADE_SUCCESS':
                        res.send({
                            "success": true,
                            "message": "success",
                            "code": 200,
                            "timestamp": (new Date()).getTime(),
                            "result": {
                                "status": 2,
                                "massage": '交易支付成功'
                            }
                        })
                        break;
                    case 'TRADE_FINISHED':
                        res.send({
                            "success": true,
                            "message": "success",
                            "code": 200,
                            "timestamp": (new Date()).getTime(),
                            "result": {
                                "status": 3,
                                "massage": '交易结束，不可退款'
                            }
                        })
                        break;
                }
            } else if (r.code === '40004') {
                res.send('交易不存在');
            }
        })
        .catch(err => {
            res.json({
                msg: '查询失败',
                err
            });
        });

});
/*********************************** 用户中心 **************************************** */

/**    
 * 收货地址信息生成
 */
router.post('/api/create_receive_info', (req, res) => {
    let id;
    let user_id = req.body.user_id;
    let receive_name = req.body.form.receive_name;
    let receive_address = req.body.form.receive_address;
    let receive_phone = req.body.form.receive_phone;
    let address_default = req.body.form.address_default;
    let sql = "select MAX(id) from receive_info";
    conn.query(sql, (error, results, fields) => {
        let Max = Number(Object.values(results[0]));
        if (!error) {
            if (Max === null) {
                id = 1;
            } else {
                id = Max + 1;
            }
        }
        let addsqlStr = "insert into receive_info(id,user_id,receive_name,receive_address,receive_phone,address_default) value(?,?,?,?,?,?)";
        let addsqlStrParams = [id, user_id, receive_name, receive_address, receive_phone, address_default];
        conn.query(addsqlStr, addsqlStrParams, (error, results, fields) => {
            if (!error) {
                results = JSON.parse(JSON.stringify(results));
                res.json({
                    success_code: 200,
                    message: '收货地址设置成功!'
                });
            } else {
                console.log(error);
                res.json({
                    err_code: 0,
                    message: '收货地址设置失败!'
                });
            }
     });
  });
});

/**    
 * 获取收货地址数据
 */
router.get('/api/receive_info', (req, res) => {
    let user_id = req.query.user_id;
    let sqlStr = "select * from receive_info where user_id =" + user_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (!error) {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        } else {
            console.log(error);
            res.json({
                err_code: 0,
                message: '收货地址信息获取失败!'
            });
        }
    });
});

/**    
 * 修改收货地址数据
 */
router.post('/api/update_receive_info', (req, res) => {
    let id = req.body.form.id;
    let receive_name = req.body.form.receive_name;
    let receive_address = req.body.form.receive_address;
    let receive_phone = req.body.form.receive_phone;
    let address_default = req.body.form.address_default;
    let sqlStr = "update receive_info set receive_name = ?, receive_address = ?,receive_phone = ?,address_default = ? where id =" + id;
    let sqlStrParams = [receive_name, receive_address, receive_phone, address_default];
    conn.query(sqlStr, sqlStrParams, (error, results, fields) => {
        if (!error) {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: '收货地址信息修改成功!'
            });
        } else {
            console.log(error);
            res.json({
                err_code: 0,
                message: '收货地址信息修改失败!'
            });
        }
    });
});

/**    
 * 删除收货地址数据
 */
router.post('/api/delete_receive_info', (req, res) => {
    let id = req.body.id;
    let sqlStr = "delete from receive_info where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (!error) {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: '收货地址信息删除成功!'
            });
        } else {
            console.log(error);
            res.json({
                err_code: 0,
                message: '收货地址信息删除失败!'
            });
        }
    });
});

/**  
 * 订单管理 status状态：0 未付款、10 已付款已完成、11 已付款未发货、12 已付款已发货、13 已付款已送达、14 已付款已收货、20 未付款已取消、21 已付款退款中、22 已付款已退款、3 用户删除记录 
 * 订单记录查看
 */
router.get('/api/check_shopping_record', (req, res) => {
    let user_id = req.query.user_id;
    let sqlStr = "select * from shopping_record where user_id =" + user_id + " AND status != 3";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '查看订单数据失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单取消，20 未付款已取消
 */
router.post('/api/cancel_shopping_record', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 20 where id = " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单取消失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单取消，21 已付款退款中
 */
router.post('/api/refund_first', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 21 where id = " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单申请退款失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单取消，22 已付款已退款
 */
router.post('/api/refund_second', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 22 where id = " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单退款失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单 11 已付款未发货
 */
router.post('/api/shopping_step_one', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 11 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单发货失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单 12 已付款已发货
 */
router.post('/api/shopping_step_two', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 12 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单支付失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});


/**    
 * 订单 13 已付款已送达
 */
router.post('/api/shopping_step_three', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 13 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单送达失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单 14 已付款已收货
 */
router.post('/api/shopping_step_four', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 14 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单收货失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 订单 10 已付款已完成
 */
router.post('/api/finish_shopping', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update shopping_record set status = 10 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '订单完成失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});

/**    
 * 单条订单记录删除 3 用户删除记录
 */
router.post('/api/delete_shopping_record', (req, res) => {
    let id = req.body.id;
    //并非真的删除记录，只是不再给用户显示
    let sqlStr = "update shopping_record set status = 3 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '删除失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功'
            });
        }
    });
});

/**    
 * 全部订单记录删除 3 用户删除记录
 */
router.post('/api/delete_All_shopping_record', (req, res) => {
    let user_id = req.body.user_id;
    //并非真的删除记录，只是不再给用户显示
    let sqlStr = "update shopping_record set status = 3 where user_id =" + user_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '删除失败'
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功'
            });
        }
    });
});

/**
 * 修改用户信息 
 */
router.post('/api/change_user_msg', (req, res) => {
    // 获取客户端传过来的商品信息
    const form = new formidable.IncomingForm();
    form.uploadDir = config.uploadsAvatarPath; // 上传图片放置的文件夹
    form.keepExtensions = true; // 保持文件的原始扩展名
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        let id = fields.id;
        let user_nickname = fields.user_nickname || '';
        let user_sex = fields.user_sex || '';
        let user_address = fields.user_address || '';
        let user_birthday = fields.user_birthday || '';
        let user_sign = fields.user_sign || '';
        let user_avatar = 'http://localhost:' + config.port + '/avatar_uploads/avatar_default.jpg';
        if (files.user_avatar) {
            user_avatar = 'http://localhost:' + config.port + '/avatar_uploads/' + basename(files.user_avatar.path);
        }

        // 验证
        if (!id) {
            res.json({
                err_code: 0,
                message: '修改用户信息失败!'
            });
        }

        // 更新数据
        let sqlStr = "UPDATE user_info SET user_nickname = ? , user_sex = ?, user_address = ?, user_birthday = ?, user_sign = ?, user_avatar = ? WHERE id = " + id;
        let strParams = [user_nickname, user_sex, user_address, user_birthday, user_sign, user_avatar];
        conn.query(sqlStr, strParams, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.json({
                    err_code: 0,
                    message: '修改用户信息失败!'
                });
            } else {
                res.json({
                    success_code: 200,
                    message: '修改用户信息成功!'
                });
            }
        });
    });
});

/**
 * 修改用户密码
 */
router.post('/api/change_user_pwd', (req, res) => {
    // 获取数据
    let id = req.body.id;
    let oriPwd = '';
    let newPwd = md5(md5(req.body.newPwd) + S_KEY);
    if (req.body.oriPwd) {
        oriPwd = md5(md5(req.body.oriPwd) + S_KEY);
    }

    let sqlStr = "SELECT * FROM user_info WHERE id = " + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '查询失败!'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            if (results[0]) { // 用户存在
                if (!results[0].user_pwd || (results[0].user_pwd && oriPwd === results[0].user_pwd)) {
                    let sqlStr = "UPDATE user_info SET user_pwd = ? WHERE id = " + id;
                    conn.query(sqlStr, [newPwd], (error, results, fields) => {
                        if (!error) {
                            res.json({
                                success_code: 200,
                                message: '密码修改成功!'
                            });
                        }
                    });
                } else if (oriPwd != results[0].user_pwd) {
                    res.json({
                        err_code: 0,
                        message: '输入的原始密码错误!'
                    });
                }
            } else {
                res.json({
                    err_code: 0,
                    message: '非法用户!'
                });
            }
        }
    });
});

/**
  修改手机
*/
router.post('/api/change_user_phone', (req, res) => {
    // 获取数据
    const id = req.body.id;
    const phone = req.body.phone;
    const code = req.body.code;

    // 验证验证码是否正确
    if (users[phone] !== code) {
        res.json({
            err_code: 0,
            message: '验证码不正确!'
        });
    }

    // 查询数据
    delete users[phone];

    let sqlStr = "UPDATE user_info SET user_phone = " + phone + " WHERE id = " + id;

    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '修改失败'
            });
            console.log(error);
        } else {
            res.json({
                success_code: 200,
                message: '修改成功'
            });
        }
    });

});

/********************************* 后台管理系统 ********************************** */

/**
 * 管理员登录
 */
router.post('/api/admin_login', (req, res) => {
    const account = req.body.account;
    const pwd = req.body.pwd;
    const md5Pwd = md5(md5(req.body.pwd) + S_KEY);

    if (!account || !pwd) {
        res.json({
            error_code: 0,
            message: "账号和密码不得为空！"
        });
    }

    let sqlStr = "SELECT * FROM administrators WHERE account = '" + account + "'";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                error_code: 0,
                message: "服务器内部错误！"
            });
        } else if (results[0]) {
            let user = JSON.parse(JSON.stringify(results[0]));
            if (md5Pwd === user['pwd']) {
                req.session.adminId = user['id'];
                res.json({
                    success_code: 200,
                    message: "登录成功！"
                });
            } else {
                res.json({
                    error_code: 0,
                    message: "密码错误！"
                });
            }
        } else {
            res.json({
                err_code: 0,
                message: "用户不存在！"
            });
        }
    });
});

/**
 * 管理员退出登录
 */
router.get('/api/admin_logout', (req, res) => {
    console.log(req.session.adminId)
    delete req.session.adminId;

    res.json({
        success_code: 200,
        message: "退出登录成功"
    });
});

/**
 * 修改商品数量 
 */
router.post('/api/change_goods_count', (req, res) => {
    // 获取数据
    const goods_id = req.body.goods_id;
    const buy_count = req.body.count;
    const user_id = req.body.user_id;

    let sqlStr = "UPDATE cart SET buy_count = ? WHERE goods_id = " + goods_id + " AND user_id = " + user_id;
    let strParams = [buy_count];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '修改商品数量失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改商品数量成功!'
            });
        }
    });
});

/**
 * 获取所有用户信息
 */
router.get('/api/admin_allusers', (req, res) => {

    let sqlStr = 'SELECT id, user_name, user_phone, user_nickname, user_address, user_status FROM user_info';

    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '请求用户数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
});


/**
 * 删除recommend单条商品
 */
router.post('/api/delete_recom_goods', (req, res) => {
    // 获取数据
    const goods_id = req.body.goods_id;

    let sqlStr = "DELETE FROM recommend WHERE goods_id =" + goods_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '删除失败!'
            });
        } else {
            let sqlStr2 = "DELETE FROM cart WHERE goods_id =" + goods_id;
            conn.query(sqlStr, (error, results, fields) => {
                if (error) {
                    console.log(error);
                    res.json({
                        err_code: 0,
                        message: '删除失败!'
                    });
                } else {
                    res.json({
                        success_code: 200,
                        message: '删除成功!'
                    });
                }
            });
        }
    });
});

/**
 * 修改recommend商品信息 
 */
router.post('/api/update_recom_goods', (req, res) => {
    // 获取数据
    const goods_id = req.body.goods_id;
    const goods_name = req.body.goods_name;
    const short_name = req.body.short_name;
    const price = req.body.price;
    const counts = req.body.counts;
    const category = req.body.category;

    let sqlStr = "UPDATE recommend SET goods_name = ?, short_name = ?, price = ?, counts = ?, category = ? WHERE goods_id = " + goods_id;
    let strParams = [goods_name, short_name, price, counts, category];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '修改失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功!'
            });
        }
    });
});

/**
 * 修改recommend商品折扣 
 */
router.post('/api/goods_discount', (req, res) => {
    // 获取数据
    let goods_id = req.body.goods_id;
    let discount = req.body.discount;
    let cut_count = req.body.cut_count;
    let cut_price = req.body.cut_price;
    let sqlStr = "UPDATE recommend SET discount = ?, cut_count = ?, cut_price = ? WHERE goods_id = " + goods_id;
    let strParams = [discount, cut_count, cut_price];
    conn.query(sqlStr, strParams, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '修改失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '修改成功!'
            });
        }
    });
});

/**
 * 添加商品到recommend
 */
router.post('/api/add_shop_recom', (req, res) => {
    // 获取客户端传过来的商品信息
    const form = new formidable.IncomingForm();
    form.uploadDir = config.uploadsGoodsPath; // 上传图片放置的文件夹
    form.keepExtensions = true; // 保持文件的原始扩展名
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        let goods_id = fields.goods_id;
        let goods_name = fields.goods_name;
        let short_name = fields.short_name;
        let price = fields.price;
        let normal_price = price + 300;
        let discount = 100;
        let cut_count = 0;
        let cut_price = 0;
        let sales_tip = fields.sales_tip;
        let category = fields.category;
        let comments_count = 0;
        let counts = fields.counts;
        let thumb_url = 'http://localhost:' + config.port + '/uploads/' + basename(files.goods_img.path);
        let image_url = 'http://localhost:' + config.port + '/uploads/' + basename(files.goods_img.path);
        let hd_thumb_url = 'http://localhost:' + config.port + '/uploads/' + basename(files.goods_img.path);

        let sql_str = "SELECT * FROM recommend WHERE goods_id = " + goods_id;
        conn.query(sql_str, (error, results, fields) => {
            if (error) {
                res.json({
                    err_code: 0,
                    message: '服务器内部错误!'
                });
            } else {
                results = JSON.parse(JSON.stringify(results));
                if (results[0]) { // 商品已经存在
                    res.json({
                        success_code: 500,
                        message: '该商品已在数据库中'
                    });
                } else { // 商品不存在
                    let add_sql = "INSERT INTO recommend(goods_id, goods_name, short_name, thumb_url, image_url, hd_thumb_url, price, normal_price, discount, cut_count, cut_price, sales_tip, category, counts, comments_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    let sql_params = [goods_id, goods_name, short_name, thumb_url, image_url, hd_thumb_url, price, normal_price, discount, cut_count, cut_price, sales_tip, category, counts, comments_count];
                    conn.query(add_sql, sql_params, (error, results, fields) => {
                        if (error) {
                            console.log(error);
                            res.json({
                                err_code: 0,
                                message: '加入失败!'
                            });
                        } else {
                            let sqlStr = "UPDATE category SET cate_counts = cate_counts + 1  WHERE cate_id = " + category;
                            conn.query(sqlStr, [], (error, results, fields) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    res.json({
                                        success_code: 200,
                                        message: '加入成功!'
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });
});


/**
 * 删除所有商品
 */
router.post('/api/delete_all_goods', (req, res) => {
    // 获取数据
    const user_id = req.body.user_id;

    let sqlStr = "DELETE FROM cart WHERE user_id = " + user_id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '删除失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '删除成功!'
            });
        }
    });

});

/**
 * 冻结用户
 */
router.post('/api/frozen_user', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update user_info set user_status = 0 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '冻结失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '冻结成功!'
            });
        }
    });
});

/**
 * 恢复用户
 */
router.post('/api/recovery_user', (req, res) => {
    let id = req.body.id;
    let sqlStr = "update user_info set user_status = 1 where id =" + id;
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                message: '恢复失败!'
            });
        } else {
            res.json({
                success_code: 200,
                message: '恢复成功!'
            });
        }
    });
});

/**    
 * 获取所有订单
 */
router.get('/api/all_shopping_record', (req, res) => {
    let sqlStr = "select * from shopping_record ";
    conn.query(sqlStr, (error, results, fields) => {
        if (error) {
            console.log(error);
            res.json({
                err_code: 0,
                message: '查看订单数据失败'
            });
        } else {
            results = JSON.parse(JSON.stringify(results));
            res.json({
                success_code: 200,
                message: results
            });
        }
    });
})

export default router;